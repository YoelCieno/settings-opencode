import { describe, expect, test } from "bun:test";
import * as mod from "../plugins/startup-bootstrap.js";
import { assertV2Plugin, systemText } from "./helpers/v2-shape";
import { afterEvent, createMockCtx, tick } from "./helpers/mock-ctx";

const SESSION_ID = "ses-bootstrap-1";
const DIRECTORY = "/repo/proj";

function createdEvent(): Record<string, unknown> {
  return {
    type: "session.created",
    sessionID: SESSION_ID,
    properties: { info: { id: SESSION_ID, directory: DIRECTORY } },
  };
}

function contextEvent(sessionID: string): Record<string, unknown> {
  return { sessionID, system: [], messages: [] };
}

describe("startup-bootstrap v2 shape", () => {
  test("default export is a v2 plugin { id, setup }", () => {
    assertV2Plugin(mod);
  });
});

describe("startup-bootstrap serena orchestration", () => {
  test("injects serena activation instruction until done", async () => {
    const m = createMockCtx();
    const plugin = assertV2Plugin(mod);
    const setupPromise = plugin.setup(m.ctx);
    m.emit(createdEvent());
    await tick();
    expect(m.sessionHooks.has("context")).toBe(true);

    const event = contextEvent(SESSION_ID);
    await m.runSessionHook("context", event);
    const text = systemText(event.system);
    expect(text.toLowerCase()).toContain("serena");
    expect(text).toContain("serena_activate_project");
    m.closeEvents();
    await setupPromise;
  });

  test("matching serena_activate_project marks session done exactly once", async () => {
    const m = createMockCtx();
    const plugin = assertV2Plugin(mod);
    const setupPromise = plugin.setup(m.ctx);
    m.emit(createdEvent());
    await tick();

    await m.runToolHook(
      "execute.after",
      afterEvent("serena_activate_project", { project: DIRECTORY }),
    );
    const event = contextEvent(SESSION_ID);
    await m.runSessionHook("context", event);
    expect(systemText(event.system).toLowerCase()).not.toContain("serena");
    m.closeEvents();
    await setupPromise;
  });

  test("basename project match also counts; wrong project does not", async () => {
    const m = createMockCtx();
    const plugin = assertV2Plugin(mod);
    const setupPromise = plugin.setup(m.ctx);
    m.emit(createdEvent());
    await tick();

    await m.runToolHook(
      "execute.after",
      afterEvent("serena_activate_project", { project: "other-proj" }),
    );
    const stillArmed = contextEvent(SESSION_ID);
    await m.runSessionHook("context", stillArmed);
    expect(systemText(stillArmed.system).toLowerCase()).toContain("serena");

    await m.runToolHook(
      "execute.after",
      afterEvent("serena_activate_project", { project: "proj" }),
    );
    const done = contextEvent(SESSION_ID);
    await m.runSessionHook("context", done);
    expect(systemText(done.system).toLowerCase()).not.toContain("serena");
    m.closeEvents();
    await setupPromise;
  });

  test("session.deleted clears state; unknown sessions are no-ops", async () => {
    const m = createMockCtx();
    const plugin = assertV2Plugin(mod);
    const setupPromise = plugin.setup(m.ctx);
    m.emit(createdEvent());
    await tick();

    m.emit({ type: "session.deleted", sessionID: SESSION_ID });
    await tick();
    const event = contextEvent(SESSION_ID);
    await m.runSessionHook("context", event);
    expect(systemText(event.system)).toBe("");

    const unknown = contextEvent("ses-never-seen");
    await m.runSessionHook("context", unknown);
    expect(systemText(unknown.system)).toBe("");
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
