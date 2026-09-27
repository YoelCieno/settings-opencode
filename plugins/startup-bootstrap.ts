import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Plugin } from "@opencode/plugin";

/**
 * Session startup bootstrap plugin (v2 API).
 *
 * Arms per-session Serena activation state on session.created, injects a
 * "call serena_activate_project first" instruction via the session "context"
 * hook until the matching activation tool call is observed, and clears state
 * on session.deleted.
 *
 * v1 -> v2 mapping:
 * - `experimental.chat.system.transform` -> `ctx.session.hook("context")`
 *   pushing `{ type: "text", text }` parts onto `event.system`.
 * - `tool.execute.after` is a single event: tool name is `event.tool`,
 *   tool args are `event.input` (v1 `input.args.project`).
 * - v1 `event` hook -> background `for await (ctx.event.subscribe())` loop;
 *   setup returns a cleanup function that stops the loop + disposes hooks.
 * - `client.app.log` is gone (v2 App = name/version/channel only) ->
 *   console.log.
 */

type SessionStartupState = {
  serenaDone: boolean;
  directory?: string;
};

const SERENA_ACTIVATE_TOOL = "serena_activate_project";

const SERENA_INSTRUCTION_FALLBACK = `Connect to Serena by calling \`${SERENA_ACTIVATE_TOOL}\` with the current project path.`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getNestedRecord(
  value: Record<string, unknown>,
  key: string,
): Record<string, unknown> | undefined {
  const nestedValue = value[key];
  return isRecord(nestedValue) ? nestedValue : undefined;
}

function getNestedString(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  const nestedValue = value[key];
  return typeof nestedValue === "string" ? nestedValue : undefined;
}

function extractSessionID(event: unknown): string | undefined {
  if (!isRecord(event)) return undefined;

  const topLevelSessionID = getNestedString(event, "sessionID");
  const session = getNestedRecord(event, "session");
  const body = getNestedRecord(event, "body");
  const bodySession = body ? getNestedRecord(body, "session") : undefined;
  const properties = getNestedRecord(event, "properties");
  const propertiesInfo = properties
    ? getNestedRecord(properties, "info")
    : undefined;
  const propertiesSession = properties
    ? getNestedRecord(properties, "session")
    : undefined;

  return (
    topLevelSessionID ??
    getNestedString(properties ?? {}, "sessionID") ??
    getNestedString(propertiesInfo ?? {}, "id") ??
    getNestedString(session ?? {}, "id") ??
    getNestedString(bodySession ?? {}, "id") ??
    getNestedString(propertiesSession ?? {}, "id") ??
    getNestedString(properties ?? {}, "id")
  );
}

function extractSessionDirectory(event: unknown): string | undefined {
  if (!isRecord(event)) return undefined;

  const info = getNestedRecord(
    getNestedRecord(event, "properties") ?? {},
    "info",
  );
  return getNestedString(info ?? {}, "directory");
}

function normalizePath(value: string): string {
  return path.resolve(value);
}

function matchesProjectTarget(
  requestedProject: string,
  directory: string,
): boolean {
  const normalizedDirectory = normalizePath(directory);

  if (path.isAbsolute(requestedProject)) {
    return normalizePath(requestedProject) === normalizedDirectory;
  }

  if (requestedProject === path.basename(normalizedDirectory)) {
    return true;
  }

  return (
    normalizePath(path.join(normalizedDirectory, requestedProject)) ===
    normalizedDirectory
  );
}

async function loadInstructionFile(
  filePath: string,
  fallback: string,
): Promise<string> {
  try {
    const content = await readFile(filePath, "utf8");
    const trimmedContent = content.trim();
    return trimmedContent.length > 0 ? trimmedContent : fallback;
  } catch {
    return fallback;
  }
}

function log(level: "debug" | "info" | "warn" | "error", message: string): void {
  try {
    // v2 App domain has no log endpoint (name/version/channel only).
    console.log(`[startup-bootstrap] ${level}: ${message}`);
  } catch {
    // ignore logging failures during startup
  }
}

export default Plugin.define({
  id: "startup-bootstrap",
  async setup(ctx: Plugin.Context) {
    const pluginDirectory = path.dirname(fileURLToPath(import.meta.url));
    const instructionsDirectory = path.resolve(
      pluginDirectory,
      "../instructions",
    );

    const serenaInstructionPath = path.join(
      instructionsDirectory,
      "serena.md",
    );

    // Mutable binding: hooks below close over it. Hooks + event loop are
    // registered/started BEFORE the file read resolves so setup never races
    // the host's first events; worst case the first injection uses fallback.
    let serenaInstruction = SERENA_INSTRUCTION_FALLBACK;
    const instructionLoaded = loadInstructionFile(
      serenaInstructionPath,
      SERENA_INSTRUCTION_FALLBACK,
    ).then(
      (text) => {
        serenaInstruction = text;
      },
      () => {
        // keep fallback on load failure
      },
    );

    const sessionState = new Map<string, SessionStartupState>();
    let stopped = false;
    const registrations: Array<{ dispose?: () => unknown }> = [];

    function markSerenaDone(sessionID: string | undefined, input: unknown): void {
      const requestedProject =
        isRecord(input) && typeof input.project === "string"
          ? input.project
          : undefined;
      if (!requestedProject) return;

      // Primary: the tool event's own session (v1 semantics).
      const direct =
        typeof sessionID === "string" ? sessionState.get(sessionID) : undefined;
      if (direct && direct.directory) {
        if (matchesProjectTarget(requestedProject, direct.directory)) {
          direct.serenaDone = true;
        }
        return;
      }
      // Fallback: tool events that carry no known sessionID (e.g. harness
      // fixtures) match by project target against armed sessions.
      for (const state of sessionState.values()) {
        if (!state.directory) continue;
        if (matchesProjectTarget(requestedProject, state.directory)) {
          state.serenaDone = true;
        }
      }
    }

      async function handleEvent(raw: unknown): Promise<void> {
      if (!isRecord(raw) || typeof raw.type !== "string") return;

      if (raw.type === "session.created") {
        const sessionID = extractSessionID(raw);
        if (!sessionID) return;

        const directory = extractSessionDirectory(raw);

        sessionState.set(sessionID, {
          serenaDone: false,
          directory,
        });

        log("info", `Startup bootstrap armed for session ${sessionID}`);
        return;
      }

      if (raw.type === "session.deleted") {
        const sessionID = extractSessionID(raw);
        if (!sessionID) return;

        sessionState.delete(sessionID);
      }
    }

    registrations.push(
      await ctx.session.hook("context", async (event) => {
        if (stopped) return;
        const sessionID = event.sessionID;
        if (!sessionID) return;

        const state = sessionState.get(sessionID);
        if (!state) return;

        if (!state.serenaDone) {
          event.system.push({
            type: "text",
            text: [
              "Session startup: activate Serena before doing substantive work.",
              serenaInstruction.trim(),
              "Do this first, then continue normally.",
            ].join("\n\n"),
          });
        }
      }),
    );

    registrations.push(
      await ctx.tool.hook("execute.after", async (event) => {
        if (stopped) return;
        if (event.tool !== SERENA_ACTIVATE_TOOL) return;
        markSerenaDone(event.sessionID, event.input);
      }),
    );

    // Background event consumption (v1 `event` hook port). Ends when the host
    // closes the stream; cleanup() also stops handling + disposes hooks.
    // Started BEFORE awaiting the instruction file so no host event is missed.
    void (async () => {
      try {
        for await (const raw of ctx.event.subscribe()) {
          if (stopped) break;
          await handleEvent(raw);
        }
      } catch {
        // stream closed during shutdown — non-fatal
      }
    })();

    // Resolve the instruction text before setup completes (hooks/loop above
    // are already live; worst case an early injection used the fallback).
    await instructionLoaded;

    return async () => {
      stopped = true;
      for (const reg of registrations) {
        try {
          await reg.dispose?.();
        } catch {
          // ignore dispose failures
        }
      }
    };
  },
});
