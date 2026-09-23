import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync, chmodSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import * as mod from "../plugins/rtk.js";
import { assertV2Plugin } from "./helpers/v2-shape";
import { beforeEvent, createMockCtx, tick } from "./helpers/mock-ctx";

let savedPath: string | undefined;
let binDir: string;

beforeEach(() => {
  savedPath = process.env.PATH;
});

afterEach(() => {
  if (savedPath === undefined) delete process.env.PATH;
  else process.env.PATH = savedPath;
});

/** Install a fake `rtk` executable that tags rewritten commands. */
function installFakeRtk(mode: "rewrite" | "fail"): void {
  binDir = mkdtempSync(path.join(os.tmpdir(), "rtk-bin-"));
  const script =
    mode === "rewrite"
      ? `#!/bin/sh\nif [ "$1" = "rewrite" ]; then shift; echo "rtk-rewrote:$*"; exit 0; fi\necho "$*"\n`
      : `#!/bin/sh\nexit 1\n`;
  const binPath = path.join(binDir, "rtk");
  writeFileSync(binPath, script, "utf8");
  chmodSync(binPath, 0o755);
  process.env.PATH = `${binDir}${path.delimiter}${savedPath ?? ""}`;
}

function isolateFromRtk(): void {
  binDir = mkdtempSync(path.join(os.tmpdir(), "rtk-empty-"));
  process.env.PATH = binDir; // no rtk binary here
}

describe("rtk v2 shape", () => {
  test("default export is a v2 plugin { id, setup }", () => {
    assertV2Plugin(mod);
  });
});

describe("rtk rewrite behavior", () => {
  test("disables itself (no tool hooks) when rtk binary not in PATH", async () => {
    isolateFromRtk();
    const m = createMockCtx();
    const plugin = assertV2Plugin(mod);
    const setupPromise = plugin.setup(m.ctx);
    await tick();
    expect(m.toolHooks.has("execute.before")).toBe(false);
    m.closeEvents();
    await setupPromise;
  });

  test("rewrites bash command via rtk rewrite", async () => {
    installFakeRtk("rewrite");
    const m = createMockCtx();
    const plugin = assertV2Plugin(mod);
    const setupPromise = plugin.setup(m.ctx);
    await tick();
    expect(m.toolHooks.has("execute.before")).toBe(true);

    const input: Record<string, string> = { command: "git status" };
    await m.runToolHook("execute.before", beforeEvent("bash", input));
    expect(input.command).not.toBe("git status");
    expect(input.command).toContain("rtk-rewrote:");
    m.closeEvents();
    await setupPromise;
  });

  test("also rewrites shell tool; leaves non-shell tools untouched", async () => {
    installFakeRtk("rewrite");
    const m = createMockCtx();
    const plugin = assertV2Plugin(mod);
    const setupPromise = plugin.setup(m.ctx);
    await tick();

    const shellInput: Record<string, string> = { command: "ls -la" };
    await m.runToolHook("execute.before", beforeEvent("shell", shellInput));
    expect(shellInput.command).toContain("rtk-rewrote:");

    const readInput: Record<string, unknown> = { path: "README.md" };
    await m.runToolHook("execute.before", beforeEvent("read", readInput));
    expect(readInput).toEqual({ path: "README.md" });
    m.closeEvents();
    await setupPromise;
  });

  test("empty/missing command passes through; rtk failure passes through", async () => {
    installFakeRtk("rewrite");
    const m = createMockCtx();
    const plugin = assertV2Plugin(mod);
    const setupPromise = plugin.setup(m.ctx);
    await tick();

    const emptyInput: Record<string, unknown> = { command: "" };
    await m.runToolHook("execute.before", beforeEvent("bash", emptyInput));
    expect(emptyInput.command).toBe("");
    m.closeEvents();
    await setupPromise;

    installFakeRtk("fail");
    const m2 = createMockCtx();
    const setup2 = plugin.setup(m2.ctx);
    await tick();
    const input: Record<string, unknown> = { command: "git status" };
    await m2.runToolHook("execute.before", beforeEvent("bash", input));
    expect(input.command).toBe("git status");
    m2.closeEvents();
    await setup2;
  });
});
