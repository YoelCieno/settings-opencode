import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import * as mod from "../plugins/model-fallback.js";
import { v2Shape } from "./helpers/v2-shape";
import { mockCtx } from "./helpers/mock-ctx";
import type { MockCtx } from "./helpers/mock-ctx";

const { assertV2Plugin } = v2Shape();
const { createMockCtx, tick } = mockCtx();

const SESSION_ID = "ses-mf-1";
const PRIMARY = { providerID: "opencode", id: "grok-code-1" };
const FALLBACK_A = { providerID: "opencode", id: "ling-3.0-flash-fin-free" };
const FALLBACK_B = { providerID: "google-ai", id: "gemini-3.7-flash" };
const FALLBACK_C = { providerID: "openai", id: "gpt-5-mini" };

/** Row shape returned by `ctx.model.list()`. */
interface Candidate {
  readonly providerID: string;
  readonly id: string;
  readonly modelID: string;
  readonly enabled: boolean;
}

/** Model reference carried by retry events / switchModel input. */
interface ModelRef {
  providerID: string;
  id: string;
  variant?: string;
}

interface RetryError {
  type: string;
  message: string;
  status?: number | undefined;
}

interface RetryEvent extends Record<string, unknown> {
  sessionID: string;
  agent: string;
  model: ModelRef;
  error: RetryError;
  attempt: number;
  decision: { retry: boolean; delay: number };
}

interface SwitchInput {
  sessionID: string;
  model: ModelRef;
}

interface FallbackConfig {
  enabled: boolean;
  defaultFallback: string[];
  cooldownMs: number;
  maxRetries: number;
  logging: boolean;
  agents: Record<string, { fallback: string[] }>;
}

type Cleanup = () => Promise<void>;

const MODELS: Candidate[] = [
  { ...PRIMARY, modelID: PRIMARY.id, enabled: true },
  { ...FALLBACK_A, modelID: FALLBACK_A.id, enabled: true },
  { ...FALLBACK_B, modelID: FALLBACK_B.id, enabled: true },
  { ...FALLBACK_C, modelID: FALLBACK_C.id, enabled: true },
  { providerID: "opencode", id: "alias-id", modelID: "real-id", enabled: true },
  { providerID: "opencode", id: "off-model", modelID: "off-model", enabled: false },
];

const isCleanup = (value: unknown): value is Cleanup => typeof value === "function";

const cleanups: Cleanup[] = [];
const tmpDirs: string[] = [];

let savedEnv: string | undefined;

beforeEach(() => {
  savedEnv = process.env.OC_MODEL_FALLBACK_CONFIG;
  delete process.env.OC_MODEL_FALLBACK_CONFIG;
});

afterEach(async () => {
  if (savedEnv === undefined) delete process.env.OC_MODEL_FALLBACK_CONFIG;
  else process.env.OC_MODEL_FALLBACK_CONFIG = savedEnv;
  for (const cleanup of cleanups.splice(0)) await cleanup();
  for (const dir of tmpDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** Fresh mkdtemp dir, tracked for afterEach rmSync. */
function tmpDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "model-fallback-"));
  tmpDirs.push(dir);
  return dir;
}

/** Authoritative config: write fallback.json + point OC_MODEL_FALLBACK_CONFIG at it. */
function writeEnvConfig(config: FallbackConfig): string {
  const file = path.join(tmpDir(), "fallback.json");
  writeFileSync(file, JSON.stringify(config));
  process.env.OC_MODEL_FALLBACK_CONFIG = file;
  return file;
}

interface BootOptions {
  readonly directory?: string;
  readonly models?: Candidate[];
  readonly switchModel?: (input: SwitchInput) => Promise<void>;
}

/** Boot plugin against a mock ctx; cleanup is drained in afterEach. */
async function boot(
  options: BootOptions = {},
): Promise<{ m: MockCtx; switched: SwitchInput[] }> {
  const switched: SwitchInput[] = [];
  const m = createMockCtx({
    location: { directory: options.directory ?? "/" },
    model: {
      list: async (): Promise<{ location: { directory: string }; data: Candidate[] }> => ({
        location: { directory: "/" },
        data: [...(options.models ?? MODELS)],
      }),
    },
    sessionApi: {
      switchModel:
        options.switchModel ??
        (async (input: SwitchInput): Promise<void> => {
          switched.push(input);
        }),
    },
  });
  const plugin = assertV2Plugin(mod);
  const dispose: unknown = await plugin.setup(m.ctx);
  cleanups.push(async (): Promise<void> => {
    if (isCleanup(dispose)) await dispose();
    m.closeEvents();
  });
  return { m, switched };
}

/** Drive the registered retry hook with one event. */
function drive(m: MockCtx, event: RetryEvent): Promise<void> {
  return m.runSessionHook("retry", event);
}

function retryEvent(overrides: Partial<RetryEvent> = {}): RetryEvent {
  return {
    sessionID: SESSION_ID,
    agent: "conductor",
    model: { ...PRIMARY },
    error: { type: "rate_limit", message: "Too Many Requests", status: 429 },
    attempt: 2,
    decision: { retry: true, delay: 1200 },
    ...overrides,
  };
}

function baseConfig(overrides: Partial<FallbackConfig> = {}): FallbackConfig {
  return {
    enabled: true,
    defaultFallback: [FALLBACK_A.id, `${FALLBACK_B.providerID}/${FALLBACK_B.id}`],
    cooldownMs: 0,
    maxRetries: 2,
    logging: false,
    agents: {},
    ...overrides,
  };
}

describe("model-fallback v2 shape", () => {
  test("default export is a v2 plugin { id, setup }", () => {
    assertV2Plugin(mod);
  });
});

describe("model-fallback config resolution", () => {
  test("missing config file → inert (no retry hook) + console.warn mentioning model-fallback", async () => {
    // Repo root already ships an enabled fallback.json, so "no file anywhere"
    // is unreachable; use the authoritative env path (spec rule 1) pointing
    // at an unreadable file → inert + warn.
    const dir = tmpDir();
    process.env.OC_MODEL_FALLBACK_CONFIG = path.join(dir, "does-not-exist.json");
    const warnSpy = spyOn(console, "warn");
    try {
      const { m } = await boot();
      expect(m.sessionHooks.has("retry")).toBe(false);
      expect(warnSpy.mock.calls.length).toBe(1);
      expect(String(warnSpy.mock.calls[0]?.join(" "))).toContain("model-fallback");
    } finally {
      warnSpy.mockRestore();
    }
  });

  test("enabled:false config → no retry hook", async () => {
    writeEnvConfig(baseConfig({ enabled: false }));
    const { m } = await boot();
    expect(m.sessionHooks.has("retry")).toBe(false);
  });

  test("project-local <directory>/fallback.json is used when env is unset", async () => {
    const dir = tmpDir();
    writeFileSync(path.join(dir, "fallback.json"), JSON.stringify(baseConfig({ enabled: false })));
    delete process.env.OC_MODEL_FALLBACK_CONFIG;
    const { m } = await boot({ directory: dir });
    expect(m.sessionHooks.has("retry")).toBe(false);
  });

  test("enabled:true config → retry hook registered", async () => {
    writeEnvConfig(baseConfig());
    const { m } = await boot();
    expect(m.sessionHooks.has("retry")).toBe(true);
  });
});

describe("model-fallback retry decisions", () => {
  test("429 on primary switches to first fallback and rewrites decision", async () => {
    writeEnvConfig(baseConfig());
    const { m, switched } = await boot();
    const event = retryEvent();
    await drive(m, event);

    expect(switched).toEqual([
      { sessionID: SESSION_ID, model: { providerID: FALLBACK_A.providerID, id: FALLBACK_A.id } },
    ]);
    expect(event.decision).toEqual({ retry: true, delay: 0 });
  });

  test("chain walk: each retry steps one link down the fallback chain", async () => {
    writeEnvConfig(baseConfig());
    const { m, switched } = await boot();

    await drive(m, retryEvent({ attempt: 2 }));
    await drive(m, retryEvent({ attempt: 3, model: { ...FALLBACK_A } }));
    await drive(m, retryEvent({ attempt: 4, model: { ...FALLBACK_B } }));

    expect(switched.map((s) => s.model.id)).toEqual([FALLBACK_A.id, FALLBACK_B.id]);
  });

  test("chain exhausted after maxRetries → decision left untouched", async () => {
    writeEnvConfig(baseConfig());
    const { m, switched } = await boot();

    await drive(m, retryEvent({ attempt: 2 }));
    await drive(m, retryEvent({ attempt: 3, model: { ...FALLBACK_A } }));
    await drive(m, retryEvent({ attempt: 4, model: { ...FALLBACK_B } }));
    const event = retryEvent({ attempt: 4, model: { ...FALLBACK_B } });
    await drive(m, event);

    expect(switched.length).toBe(2);
    expect(event.decision).toEqual({ retry: true, delay: 1200 });
  });

  test("agent-specific chain overrides defaultFallback", async () => {
    writeEnvConfig(
      baseConfig({
        agents: {
          conductor: { fallback: ["google-ai/gemini-3.7-flash"] },
          title: { fallback: [FALLBACK_C.id] },
        },
      }),
    );
    const { m, switched } = await boot();

    await drive(m, retryEvent({ agent: "title", attempt: 2 }));
    await drive(m, retryEvent({ agent: "conductor", attempt: 2, model: { ...FALLBACK_C } }));

    expect(switched.map((s) => s.model.id)).toEqual([FALLBACK_C.id, FALLBACK_B.id]);
  });

  test("transport/network error without status is fallback-worthy", async () => {
    writeEnvConfig(baseConfig());
    const { m, switched } = await boot();

    await drive(
      m,
      retryEvent({ error: { type: "transport", message: "fetch failed", status: undefined } }),
    );

    expect(switched.length).toBe(1);
  });

  test("entry without slash resolves via modelID alias to row id", async () => {
    writeEnvConfig(baseConfig({ defaultFallback: ["real-id"] }));
    const { m, switched } = await boot();

    await drive(m, retryEvent());

    expect(switched).toEqual([
      { sessionID: SESSION_ID, model: { providerID: "opencode", id: "alias-id" } },
    ]);
  });

  test("unresolvable and disabled rows are skipped, first match wins", async () => {
    writeEnvConfig(
      baseConfig({ defaultFallback: ["ghost-model", "off-model", "openai/gpt-5-mini"] }),
    );
    const { m, switched } = await boot();

    await drive(m, retryEvent());

    expect(switched.map((s) => s.model.id)).toEqual([FALLBACK_C.id]);
  });

  test("invalid_request 400 is not fallback-worthy → decision unchanged", async () => {
    writeEnvConfig(baseConfig());
    const { m, switched } = await boot();
    const event = retryEvent({
      error: { type: "invalid_request", message: "bad request", status: 400 },
    });

    await drive(m, event);

    expect(switched.length).toBe(0);
    expect(event.decision).toEqual({ retry: true, delay: 1200 });
  });

  test("cooldown suppresses the second switch", async () => {
    writeEnvConfig(baseConfig({ cooldownMs: 60000, maxRetries: 5 }));
    const { m, switched } = await boot();

    await drive(m, retryEvent({ attempt: 2 }));
    await drive(m, retryEvent({ attempt: 3, model: { ...FALLBACK_A } }));

    expect(switched.length).toBe(1);
  });

  test("maxRetries:1 allows a single switch per cycle", async () => {
    writeEnvConfig(baseConfig({ maxRetries: 1 }));
    const { m, switched } = await boot();

    await drive(m, retryEvent({ attempt: 2 }));
    await drive(m, retryEvent({ attempt: 3, model: { ...FALLBACK_A } }));

    expect(switched.length).toBe(1);
  });

  test("switchModel rejection does not throw out of the hook and leaves decision untouched", async () => {
    writeEnvConfig(baseConfig());
    const { m } = await boot({
      switchModel: async (): Promise<void> => {
        throw new Error("switch failed");
      },
    });
    const event = retryEvent();

    await drive(m, event);

    expect(event.decision).toEqual({ retry: true, delay: 1200 });
  });

  test("session.deleted resets per-session switch state", async () => {
    writeEnvConfig(baseConfig({ maxRetries: 1 }));
    const { m, switched } = await boot();

    await drive(m, retryEvent({ attempt: 2 }));
    await drive(m, retryEvent({ attempt: 3, model: { ...FALLBACK_A } }));
    expect(switched.length).toBe(1);

    m.emit({ type: "session.deleted", sessionID: SESSION_ID });
    await tick();

    await drive(m, retryEvent({ attempt: 3, model: { ...FALLBACK_A } }));
    expect(switched.map((s) => s.model.id)).toEqual([FALLBACK_A.id, FALLBACK_B.id]);
  });

  test("logging:true logs one model-fallback line, logging:false stays silent", async () => {
    writeEnvConfig(baseConfig({ logging: true }));
    const logSpy = spyOn(console, "log");
    try {
      const { m } = await boot();
      await drive(m, retryEvent());
      expect(logSpy.mock.calls.length).toBe(1);
      const line = String(logSpy.mock.calls[0]?.join(" "));
      expect(line).toContain("model-fallback");
      expect(line).toContain(FALLBACK_A.id);
    } finally {
      logSpy.mockRestore();
    }

    writeEnvConfig(baseConfig({ logging: false }));
    const silentSpy = spyOn(console, "log");
    try {
      const { m } = await boot();
      await drive(m, retryEvent());
      expect(silentSpy.mock.calls.length).toBe(0);
    } finally {
      silentSpy.mockRestore();
    }
  });
});

describe("model-fallback billing/upstream error classification", () => {
  test("insufficient funds (provider.quota, 402) switches to fallback", async () => {
    writeEnvConfig(baseConfig());
    const { m, switched } = await boot();
    const event = retryEvent({
      error: { type: "provider.quota", message: "Insufficient account funds", status: 402 },
    });

    await drive(m, event);

    expect(switched.length).toBe(1);
    expect(switched[0]?.model.id).toBe(FALLBACK_A.id);
    expect(event.decision).toEqual({ retry: true, delay: 0 });
  });

  test("upstream funds failure (unknown type, 402) switches to fallback", async () => {
    writeEnvConfig(baseConfig());
    const { m, switched } = await boot();

    await drive(
      m,
      retryEvent({
        error: {
          type: "unknown",
          message: "Upstream request failed: Insufficient account funds",
          status: 402,
        },
      }),
    );

    expect(switched.length).toBe(1);
  });

  test("funds failure without a status still switches", async () => {
    writeEnvConfig(baseConfig());
    const { m, switched } = await boot();

    await drive(
      m,
      retryEvent({
        error: { type: "provider.unknown", message: "Insufficient account funds", status: undefined },
      }),
    );

    expect(switched.length).toBe(1);
  });

  test("provider auth failure (401) switches to fallback", async () => {
    writeEnvConfig(baseConfig());
    const { m, switched } = await boot();

    await drive(
      m,
      retryEvent({ error: { type: "provider.auth", message: "Invalid API key", status: 401 } }),
    );

    expect(switched.length).toBe(1);
  });

  test("provider quota with 403 switches (signal beats the status gate)", async () => {
    writeEnvConfig(baseConfig());
    const { m, switched } = await boot();

    await drive(
      m,
      retryEvent({ error: { type: "provider.quota", message: "Quota exceeded", status: 403 } }),
    );

    expect(switched.length).toBe(1);
  });

  test("provider.invalid-request still never switches", async () => {
    writeEnvConfig(baseConfig());
    const { m, switched } = await boot();

    await drive(
      m,
      retryEvent({
        error: { type: "provider.invalid-request", message: "bad request", status: 400 },
      }),
    );
    expect(switched.length).toBe(0);

    const event = retryEvent({
      error: {
        type: "provider.invalid-request",
        message: "rate limit reached while parsing",
        status: undefined,
      },
    });
    await drive(m, event);

    expect(switched.length).toBe(0);
    expect(event.decision).toEqual({ retry: true, delay: 1200 });
  });

  test("logs a skip reason when logging is enabled", async () => {
    writeEnvConfig(baseConfig({ logging: true }));
    const { m, switched } = await boot();
    const logSpy = spyOn(console, "log").mockImplementation(() => undefined);
    try {
      await drive(
        m,
        retryEvent({ error: { type: "unknown", message: "hello world", status: undefined } }),
      );
      expect(logSpy.mock.calls.length).toBe(1);
      const line = String(logSpy.mock.calls[0]?.join(" "));
      expect(line).toContain("model-fallback");
      expect(line.toLowerCase()).toContain("skip");
      expect(switched.length).toBe(0);
    } finally {
      logSpy.mockRestore();
    }
  });

  test("logs nothing on a skip when logging is disabled", async () => {
    writeEnvConfig(baseConfig({ logging: false }));
    const { m, switched } = await boot();
    const logSpy = spyOn(console, "log").mockImplementation(() => undefined);
    try {
      await drive(
        m,
        retryEvent({ error: { type: "unknown", message: "hello world", status: undefined } }),
      );
      expect(logSpy.mock.calls.length).toBe(0);
      expect(switched.length).toBe(0);
    } finally {
      logSpy.mockRestore();
    }
  });

  test.each([402, 404, 408, 409, 425, 429])("status %i is fallback-worthy", async (status) => {
    writeEnvConfig(baseConfig());
    const { m, switched } = await boot();

    await drive(m, retryEvent({ error: { type: "unknown", message: "boom", status } }));

    expect(switched.length).toBe(1);
  });

  test.each([400, 405, 415, 422])("status %i never switches", async (status) => {
    writeEnvConfig(baseConfig());
    const { m, switched } = await boot();
    const event = retryEvent({ error: { type: "unknown", message: "boom", status } });

    await drive(m, event);

    expect(switched.length).toBe(0);
    expect(event.decision).toEqual({ retry: true, delay: 1200 });
  });

  test.each([401, 403, 426, 500, 503])("status %i falls through to the range gate", async (status) => {
    writeEnvConfig(baseConfig());
    const { m, switched } = await boot();

    await drive(m, retryEvent({ error: { type: "unknown", message: "boom", status } }));

    expect(switched.length).toBe(status >= 500 ? 1 : 0);
  });
});
