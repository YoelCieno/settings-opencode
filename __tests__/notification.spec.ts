import { describe, expect, test } from "bun:test";
import * as mod from "../plugins/notification.js";
import { v2Shape } from "./helpers/v2-shape";
import { mockCtx } from "./helpers/mock-ctx";
import type { MockCtx } from "./helpers/mock-ctx";

const { assertV2Plugin } = v2Shape();
const { afterEvent, createMockCtx, tick } = mockCtx();

function startupNames(): Set<string> {
  const exported: unknown = mod.SERENA_STARTUP_TOOL_NAMES;
  expect(exported, "v2 port must export SERENA_STARTUP_TOOL_NAMES").toBeDefined();
  if (!(exported instanceof Set)) throw new Error("v2 port must export SERENA_STARTUP_TOOL_NAMES as a Set");
  for (const entry of exported) {
    if (typeof entry !== "string") throw new Error("SERENA_STARTUP_TOOL_NAMES must contain only strings");
  }
  return exported;
}

describe("notification v2 shape", () => {
  test("default export is a v2 plugin { id, setup }", () => {
    assertV2Plugin(mod);
  });

  test("exports the serena startup tool-name set", () => {
    const names = startupNames();
    for (const n of ["serena_activate_project", "serena_initial_instructions", "serena_check_onboarding_performed"]) {
      expect(names.has(n)).toBe(true);
    }
  });
});

describe("notification filtering", () => {
  function mockWithNotifier(): { m: MockCtx; calls: unknown[][] } {
    const calls: unknown[][] = [];
    const dollar = (...args: unknown[]): Promise<void> => {
      calls.push(args);
      return Promise.resolve();
    };
    // Seam: injected `$` keeps tests hermetic + platform-safe (v1 shells
    // osascript/afplay). Coder: use ctx `$` when present, else Bun.$.
    const m = createMockCtx({ $: dollar });
    return { m, calls };
  }

  test("serena startup noise (any case/separator) never notifies", async () => {
    const { m, calls } = mockWithNotifier();
    const plugin = assertV2Plugin(mod);
    const setupPromise = plugin.setup(m.ctx);
    await tick();
    expect(m.toolHooks.has("execute.after")).toBe(true);

    for (const tool of [
      "serena_activate_project",
      "Serena_Activate_Project",
      "serena-activate-project",
      "initial_instructions",
      "check_onboarding_performed",
    ]) {
      await m.runToolHook("execute.after", afterEvent(tool, {}));
    }
    m.emit({ type: "session.idle", sessionID: "ses-test" });
    await tick();
    expect(calls.length).toBe(0);
    m.closeEvents();
    await setupPromise;
  });

  test("substantive tool work notifies once per idle, then resets", async () => {
    const { m, calls } = mockWithNotifier();
    const plugin = assertV2Plugin(mod);
    const setupPromise = plugin.setup(m.ctx);
    await tick();

    await m.runToolHook("execute.after", afterEvent("bash", { command: "bun test" }));
    m.emit({ type: "session.idle", sessionID: "ses-test" });
    await tick();
    expect(calls.length).toBeGreaterThan(0);

    // Second idle with no new work: no repeat notification.
    const afterFirst = calls.length;
    m.emit({ type: "session.idle", sessionID: "ses-test" });
    await tick();
    expect(calls.length).toBe(afterFirst);
    m.closeEvents();
    await setupPromise;
  });
});
