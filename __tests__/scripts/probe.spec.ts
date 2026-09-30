import { describe, expect, test } from "bun:test";
import { probe } from "../../scripts/probe.js";

const {
  isBunSupported,
  toProbeError,
  toExceptionError,
  fromPageError,
  toConsoleArgs,
  formatReport,
  hasFailures,
} = probe();

describe("isBunSupported", () => {
  test("accepts bun >= 1.3.12", () => {
    expect(isBunSupported("1.3.12")).toBe(true);
    expect(isBunSupported("1.4.2")).toBe(true);
    expect(isBunSupported("1.10.0")).toBe(true);
  });

  test("rejects bun < 1.3.12", () => {
    expect(isBunSupported("1.3.11")).toBe(false);
    expect(isBunSupported("1.2.0")).toBe(false);
  });

  test("rejects non-version garbage", () => {
    expect(isBunSupported("")).toBe(false);
    expect(isBunSupported("latest")).toBe(false);
  });
});

describe("toProbeError", () => {
  test("maps console.error with stack frame to message + source:line", () => {
    const err = toProbeError({
      type: "error",
      args: [{ description: "TypeError: x is not a function" }],
      stackTrace: { callFrames: [{ url: "http://localhost:5173/src/app.ts", lineNumber: 9 }] },
    });
    expect(err).toEqual({
      message: "TypeError: x is not a function",
      source: "http://localhost:5173/src/app.ts",
      line: 10, // CDP lineNumber is 0-based
    });
  });

  test("uses primitive values directly", () => {
    const err = toProbeError({ type: "error", args: [{ value: "boom" }, { value: 42 }] });
    if (err === null) throw new Error("expected non-null for type: error");
    expect(err.message).toBe("boom 42");
    expect(err.source).toBe("(anonymous)");
    expect(err.line).toBe(0);
  });

  test("ignores non-error console types", () => {
    expect(toProbeError({ type: "log", args: [{ value: "hi" }] })).toBeNull();
  });
});

describe("toExceptionError", () => {
  test("maps uncaught exception with location", () => {
    const err = toExceptionError({
      exceptionDetails: {
        text: "Uncaught",
        url: "http://localhost:5173/src/main.ts",
        lineNumber: 4,
        exception: { description: "ReferenceError: foo is not defined" },
      },
    });
    expect(err).toEqual({
      message: "ReferenceError: foo is not defined",
      source: "http://localhost:5173/src/main.ts",
      line: 5,
    });
  });

  test("falls back to text when exception missing", () => {
    const err = toExceptionError({ exceptionDetails: { text: "Uncaught", lineNumber: 0 } });
    expect(err.message).toBe("Uncaught");
    expect(err.source).toBe("(anonymous)");
    expect(err.line).toBe(1);
  });
});

describe("formatReport", () => {
  const base = {
    url: "http://localhost:5173/",
    title: "Forma",
    errors: [],
    screenshot: "/tmp/opencode/probe-1.png",
    ms: 8100,
    unreachable: null,
  };

  test("clean page reports zero errors with title and screenshot", () => {
    const out = formatReport(base);
    expect(out).toContain("title: Forma");
    expect(out).toContain("console errors: 0");
    expect(out).toContain("screenshot: /tmp/opencode/probe-1.png");
    expect(out).toContain("PASS");
  });

  test("lists each error with source:line", () => {
    const out = formatReport({
      ...base,
      errors: [
        { message: "boom", source: "http://x/app.ts", line: 3 },
        { message: "bang", source: "(anonymous)", line: 0 },
      ],
    });
    expect(out).toContain("console errors: 2");
    expect(out).toContain("http://x/app.ts:3 boom");
    expect(out).toContain("(anonymous):0 bang");
    expect(out).toContain("FAIL");
  });

  test("unreachable URL reports reason and fails", () => {
    const out = formatReport({ ...base, screenshot: null, unreachable: "connection refused" });
    expect(out).toContain("unreachable: connection refused");
    expect(out).toContain("screenshot: (skipped)");
    expect(hasFailures({ ...base, screenshot: null, unreachable: "connection refused" })).toBe(true);
  });
});

describe("hasFailures", () => {
  const base = {
    url: "u",
    title: "t",
    errors: [],
    screenshot: null,
    ms: 1,
    unreachable: null,
  };

  test("clean pass", () => {
    expect(hasFailures(base)).toBe(false);
  });

  test("errors fail", () => {
    expect(
      hasFailures({ ...base, errors: [{ message: "x", source: "s", line: 1 }] }),
    ).toBe(true);
  });
});

describe("fromPageError", () => {
  test("parses V8 stack frame to source:line", () => {
    const err = fromPageError({
      msg: "boom",
      stack: "Error\n    at console.error (http://localhost:5173/src/app.ts:10:5)\n    at main (http://localhost:5173/src/main.ts:2:1)",
    });
    expect(err).toEqual({
      message: "boom",
      source: "http://localhost:5173/src/app.ts",
      line: 10,
    });
  });

  test("skips wrapper frame, uses real call site", () => {
    const err = fromPageError({
      msg: "boom",
      stack:
        "Error\n    at console.error (<anonymous>:1:88)\n    at http://127.0.0.1:8899/err.html:1:52",
    });
    expect(err).toEqual({
      message: "boom",
      source: "http://127.0.0.1:8899/err.html",
      line: 1,
    });
  });

  test("anonymous frame falls back", () => {
    expect(fromPageError({ msg: "x", stack: undefined })).toEqual({
      message: "x",
      source: "(anonymous)",
      line: 0,
    });
  });

  test("stack without parens falls back", () => {
    expect(fromPageError({ msg: "y", stack: "Error\n    at weird" })).toEqual({
      message: "y",
      source: "(anonymous)",
      line: 0,
    });
  });
});

describe("toConsoleArgs", () => {
  test("primitives become value args", () => {
    expect(toConsoleArgs(["boom", 42, null])).toEqual([
      { value: "boom" },
      { value: 42 },
      { value: null },
    ]);
  });

  test("RemoteObject descriptors become description args", () => {
    expect(toConsoleArgs([{ type: "object", description: "TypeError: bad" }])).toEqual([
      { description: "TypeError: bad" },
    ]);
  });
});
