/**
 * One-shot browser probe: navigate, collect console errors + uncaught
 * exceptions (with source locations), screenshot, report.
 * Zero MCP — Bun.WebView (Chrome backend), requires bun >= 1.3.12.
 * CLI: bun scripts/probe.ts <url>  → exit 0 pass, 1 fail, 2 usage
 */

const MIN_BUN = [1, 3, 12] as const;
const SETTLE_MS = 300;

export interface ConsoleError {
  readonly message: string;
  readonly source: string;
  readonly line: number;
}

export interface ProbeResult {
  readonly url: string;
  readonly title: string;
  readonly errors: readonly ConsoleError[];
  readonly screenshot: string | null;
  readonly ms: number;
  readonly unreachable: string | null;
}

export interface ConsoleCallParams {
  readonly type: string;
  readonly args: readonly ConsoleArg[];
  readonly stackTrace?: { readonly callFrames: readonly CallFrame[] };
}

export interface ConsoleArg {
  readonly value?: unknown;
  readonly description?: string;
}

export interface CallFrame {
  readonly url: string;
  readonly lineNumber: number;
}

export interface ExceptionParams {
  readonly exceptionDetails: {
    readonly text: string;
    readonly url?: string;
    readonly lineNumber?: number;
    readonly exception?: { readonly description?: string };
  };
}

export interface PageErrorRecord {
  readonly msg: string;
  readonly stack: string | undefined;
}

export interface ProbeFactory {
  readonly isBunSupported: (version: string) => boolean;
  readonly toProbeError: (data: ConsoleCallParams) => ConsoleError | null;
  readonly toExceptionError: (data: ExceptionParams) => ConsoleError;
  readonly fromPageError: (record: PageErrorRecord) => ConsoleError;
  readonly toConsoleArgs: (raw: readonly unknown[]) => readonly ConsoleArg[];
  readonly formatReport: (result: ProbeResult) => string;
  readonly hasFailures: (result: ProbeResult) => boolean;
  readonly run: (url: string) => Promise<ProbeResult>;
}

export function probe(): ProbeFactory {
  const isBunSupported = (version: string): boolean => {
    const parts = version.split(".").map(Number);
    if (parts.length < 2 || parts.some(Number.isNaN)) return false;
    const [major = 0, minor = 0, patch = 0] = parts;
    const [minMajor, minMinor, minPatch] = MIN_BUN;
    if (major !== minMajor) return major > minMajor;
    if (minor !== minMinor) return minor > minMinor;
    return patch >= minPatch;
  };

  const describeArg = (arg: ConsoleArg): string => {
    if (typeof arg.value === "string") return arg.value;
    if (arg.value !== undefined) return String(arg.value);
    return arg.description ?? "(object)";
  };

  const toProbeError = (data: ConsoleCallParams): ConsoleError | null => {
    if (data.type !== "error") return null;
    const frame = data.stackTrace?.callFrames[0];
    return {
      message: data.args.map(describeArg).join(" "),
      source: frame?.url ?? "(anonymous)",
      line: frame === undefined ? 0 : frame.lineNumber + 1, // CDP is 0-based
    };
  };

  const toExceptionError = (data: ExceptionParams): ConsoleError => {
    const details = data.exceptionDetails;
    return {
      message: details.exception?.description ?? details.text,
      source: details.url ?? "(anonymous)",
      line: (details.lineNumber ?? -1) + 1,
    };
  };

  const fromPageError = (record: PageErrorRecord): ConsoleError => {
    // V8 stack: "Error\n    at console.error (url:line:col)\n    ..."
    // V8 frames come bare ("at url:line:col") or parenthesized ("at fn (…)");
    // prefer first non-<anonymous> frame (skip the injected wrapper's own
    // frame), else first frame, else fallback.
    const frames = (record.stack ?? "")
      .split("\n")
      .slice(1)
      .map((line) => line.trim().replace(/^at /, ""))
      .map((line) => line.match(/\((.*)\)$/)?.[1] ?? line) // unwrap "fn (loc)"
      .map((loc) => loc.match(/^(.*):(\d+):(\d+)$/))
      .filter((m): m is RegExpMatchArray => m !== null);
    const pick = frames.find((m) => m[1] !== "<anonymous>") ?? frames[0];
    return {
      message: record.msg,
      source: pick?.[1] ?? "(anonymous)",
      line: pick === undefined ? 0 : Number(pick[2]),
    };
  };

  const toConsoleArgs = (raw: readonly unknown[]): readonly ConsoleArg[] =>
    raw.map((arg): ConsoleArg => {
      if (arg !== null && typeof arg === "object" && "description" in arg) {
        const desc = (arg as { description: unknown }).description;
        return { description: typeof desc === "string" ? desc : String(desc) };
      }
      return { value: arg };
    });

  const formatReport = (result: ProbeResult): string => {
    const lines: string[] = [`probe: ${result.url} (${result.ms}ms)`];
    if (result.unreachable !== null) lines.push(`unreachable: ${result.unreachable}`);
    lines.push(`title: ${result.title || "(no title)"}`);
    lines.push(`console errors: ${result.errors.length}`);
    for (const err of result.errors) {
      lines.push(`  ${err.source}:${err.line} ${err.message.split("\n")[0]}`);
    }
    lines.push(`screenshot: ${result.screenshot ?? "(skipped)"}`);
    lines.unshift(hasFailures(result) ? "FAIL" : "PASS");
    return lines.join("\n");
  };

  const hasFailures = (result: ProbeResult): boolean =>
    result.unreachable !== null || result.errors.length > 0;

  const run = async (url: string): Promise<ProbeResult> => {
    const start = performance.now();
    const consoleCaught: ConsoleError[] = [];
    const exceptions: ConsoleError[] = [];
    // Fallback channel: guaranteed message capture (no location).
    const view = new Bun.WebView({
      backend: "chrome",
      console: (type, ...args) => {
        if (type !== "error") return;
        const err = toProbeError({ type, args: toConsoleArgs(args) });
        if (err !== null) consoleCaught.push(err);
      },
    });

    let navError: string | null = null;
    let pageErrors: readonly PageErrorRecord[] | null = null;
    try {
      await view.navigate("about:blank"); // establishes CDP session
      await view.cdp("Runtime.enable");
      // Primary channel: page-side console.error wrapper installed before any
      // page script → captures message + V8 stack (Runtime.consoleAPICalled is
      // not delivered by Bun 1.4.2, verified empirically).
      await view.cdp("Page.addScriptToEvaluateOnNewDocument", {
        source:
          "(()=>{const oe=console.error.bind(console);console.error=(...a)=>{" +
          "(window.__probeErrors=window.__probeErrors||[])" +
          ".push({msg:a.map(x=>{try{return typeof x==='object'?JSON.stringify(x):String(x)}catch{return String(x)}}).join(' '),stack:new Error().stack});" +
          "oe(...a)}})()",
      });
      // Single documented boundary cast: EventTarget delivers untyped `Event`;
      // CDP events carry parsed params on `.data` (Bun.WebView CDP contract).
      const onCdp = <T>(type: string, handler: (data: T) => void): void => {
        view.addEventListener(type, (ev) => handler((ev as Event & { data: T }).data));
      };
      onCdp<ExceptionParams>("Runtime.exceptionThrown", (data) => {
        exceptions.push(toExceptionError(data));
      });
      await view.navigate(url);
      await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
      pageErrors = (await view.evaluate("window.__probeErrors ?? null")) as
        | readonly PageErrorRecord[]
        | null;
    } catch (error) {
      navError = error instanceof Error ? error.message : String(error);
    }

    const errors: ConsoleError[] =
      pageErrors !== null && pageErrors.length > 0
        ? pageErrors.map(fromPageError)
        : pageErrors === null && navError === null
          ? consoleCaught
          : [...pageErrors ?? [], ...consoleCaught].map((r) => fromPageError(r as PageErrorRecord));
    const allErrors = [...errors, ...exceptions];

    let screenshot: string | null = null;
    if (navError === null) {
      screenshot = `/tmp/opencode/probe-${Date.now()}.png`;
      await Bun.write(screenshot, await view.screenshot());
    }
    view.close();

    return {
      url,
      title: navError === null ? view.title : "",
      errors: allErrors,
      screenshot,
      ms: Math.round(performance.now() - start),
      unreachable: navError,
    };
  };

  return { isBunSupported, toProbeError, toExceptionError, fromPageError, toConsoleArgs, formatReport, hasFailures, run };
}

if (import.meta.main) {
  const url = process.argv[2];
  const { run, formatReport, hasFailures, isBunSupported } = probe();
  if (url === undefined) {
    console.error("usage: bun scripts/probe.ts <url>");
    process.exit(2);
  }
  if (!isBunSupported(process.versions.bun ?? "0")) {
    console.error(`probe requires bun >= 1.3.12 (got ${process.versions.bun ?? "unknown"})`);
    process.exit(2);
  }
  const result = await run(url);
  console.log(formatReport(result));
  process.exit(hasFailures(result) ? 1 : 0);
}
