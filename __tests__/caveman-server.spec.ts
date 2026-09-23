import { afterEach, describe, expect, test } from "bun:test";
import os from "node:os";
import path from "node:path";
import { existsSync, unlinkSync } from "node:fs";
import * as mod from "../plugins/caveman-server.js";
import { assertV2Plugin, systemText } from "./helpers/v2-shape";
import { createMockCtx, tick } from "./helpers/mock-ctx";

const SESSION_ID = "ses-caveman-flag-test";

function flagPath(sessionID: string): string {
  return path.join(os.tmpdir(), `opencode-caveman-${sessionID}.flag`);
}

afterEach(() => {
  try {
    unlinkSync(flagPath(SESSION_ID));
  } catch {
    // absent is fine
  }
});

describe("caveman-server v2 shape", () => {
  test("default export is a v2 plugin { id, setup }", () => {
    assertV2Plugin(mod);
  });
});

describe("caveman-server system injection", () => {
  test("context hook appends caveman instruction without replacing system", async () => {
    const m = createMockCtx();
    const plugin = assertV2Plugin(mod);
    const setupPromise = plugin.setup(m.ctx);
    await tick();
    expect(m.sessionHooks.has("context")).toBe(true);

    const event: Record<string, unknown> = {
      sessionID: SESSION_ID,
      system: [{ type: "text", text: "existing system prompt" }],
      messages: [],
    };
    await m.runSessionHook("context", event);
    const text = systemText(event.system);
    expect(text).toContain("existing system prompt");
    expect(text.toLowerCase()).toContain("caveman");
    m.closeEvents();
    await setupPromise;
  });

  test("writes flag file on session.created, removes it on session.deleted", async () => {
    const m = createMockCtx();
    const plugin = assertV2Plugin(mod);
    const setupPromise = plugin.setup(m.ctx);
    m.emit({ type: "session.created", sessionID: SESSION_ID });
    await tick();
    expect(existsSync(flagPath(SESSION_ID))).toBe(true);

    m.emit({ type: "session.deleted", sessionID: SESSION_ID });
    await tick();
    expect(existsSync(flagPath(SESSION_ID))).toBe(false);
    m.closeEvents();
    await setupPromise;
  });

  test("setup returns a v2 cleanup function", async () => {
    const m = createMockCtx();
    const plugin = assertV2Plugin(mod);
    const setupPromise = plugin.setup(m.ctx);
    m.closeEvents();
    const cleanup = await setupPromise;
    expect(typeof cleanup).toBe("function");
  });
});
