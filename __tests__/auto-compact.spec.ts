import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import * as mod from "../plugins/auto-compact.js";
import { v2Shape } from "./helpers/v2-shape";
import { mockCtx } from "./helpers/mock-ctx";
import type { CompactionHookEvent } from "./helpers/mock-ctx";

const { assertV2Plugin, systemText } = v2Shape();
const { afterEvent, createMockCtx, tick } = mockCtx();

const SESSION_ID = "ses-autocompact-1";

function sessionCreated(): Record<string, unknown> {
  return { type: "session.created", sessionID: SESSION_ID };
}

describe("auto-compact v2 shape", () => {
  test("default export is a v2 plugin { id, setup }", () => {
    assertV2Plugin(mod);
  });
});

describe("auto-compact arming + idle trigger", () => {
  let savedThreshold: string | undefined;

  beforeEach(() => {
    savedThreshold = process.env.OC_COMPACT_THRESHOLD;
    process.env.OC_COMPACT_THRESHOLD = "3";
  });

  afterEach(() => {
    if (savedThreshold === undefined) delete process.env.OC_COMPACT_THRESHOLD;
    else process.env.OC_COMPACT_THRESHOLD = savedThreshold;
  });

  test("compacts on idle only after threshold tool calls", async () => {
    const summarized: unknown[] = [];
    const m = createMockCtx({
      sessionApi: { summarize: async (args: unknown): Promise<void> => void summarized.push(args) },
    });
    const plugin = assertV2Plugin(mod);
    const setupDone = plugin.setup(m.ctx);
    m.emit(sessionCreated());
    await tick();

    // Below threshold: idle must NOT compact.
    await m.runToolHook("execute.after", afterEvent("bash", { command: "ls" }));
    m.emit({ type: "session.idle", sessionID: SESSION_ID });
    await tick();
    expect(summarized.length).toBe(0);

    // Reach threshold (3 calls), then idle compacts exactly once.
    await m.runToolHook("execute.after", afterEvent("bash", { command: "ls" }));
    await m.runToolHook("execute.after", afterEvent("read", { path: "x" }));
    m.emit({ type: "session.idle", sessionID: SESSION_ID });
    await tick();
    expect(summarized.length).toBe(1);
    expect(JSON.stringify(summarized[0])).toContain(SESSION_ID);

    // Counter reset: next idle without new tools must NOT compact again.
    m.emit({ type: "session.idle", sessionID: SESSION_ID });
    await tick();
    expect(summarized.length).toBe(1);

    m.closeEvents();
    await setupDone;
  });

  test("setup returns a v2 cleanup function (v1 dispose port)", async () => {
    const m = createMockCtx();
    const plugin = assertV2Plugin(mod);
    const setupPromise = plugin.setup(m.ctx);
    m.closeEvents();
    const cleanup = await setupPromise;
    expect(typeof cleanup).toBe("function");
  });
});

describe("auto-compact summary hardening", () => {
  test("compaction hook produces a resume-ready checkpoint", async () => {
    const m = createMockCtx();
    const plugin = assertV2Plugin(mod);
    const setupPromise = plugin.setup(m.ctx);
    await tick();
    expect(m.sessionHooks.has("compaction")).toBe(true);

    const event: CompactionHookEvent = { system: [], messages: [] };
    await m.runSessionHook("compaction", event);
    const summary: unknown = event.result?.summary;
    const text =
      typeof summary === "string"
        ? summary
        : systemText(event.system) + JSON.stringify(event.result ?? "");
    for (const marker of ["Goal", "Next steps", "Evidence"]) {
      expect(text).toContain(marker);
    }
    m.closeEvents();
    await setupPromise;
  });
});
