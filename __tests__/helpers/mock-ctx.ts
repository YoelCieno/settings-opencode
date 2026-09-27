import type { Plugin } from "@opencode/plugin";

type Context = Plugin.Context;

export type HookFn = (event: Record<string, unknown>) => Promise<void> | void;

/** Typed compaction-hook event: `result.summary` instead of cast access. */
export interface CompactionHookEvent extends Record<string, unknown> {
  system: unknown[];
  messages: unknown[];
  result?: { summary?: string };
}

/**
 * Hand-rolled v2 Context mock. Captures hook registrations so tests can
 * drive `tool.hook` / `session.hook` callbacks deterministically, and
 * provides a controllable `event.subscribe()` async iterator (background
 * for-await consumption pattern) via `emit()` + `close()`.
 *
 * Extra fields (summarize, notifyExec, ...) are intentional seams the
 * ported plugins must use when the v2 domain API has no equivalent;
 * they are typed — no `any`.
 */
export interface MockCtx {
  readonly ctx: Context;
  readonly toolHooks: Map<string, HookFn[]>;
  readonly sessionHooks: Map<string, HookFn[]>;
  readonly emitted: unknown[];
  emit(event: unknown): void;
  closeEvents(): void;
  runToolHook(name: string, event: Record<string, unknown>): Promise<void>;
  runSessionHook(name: string, event: Record<string, unknown>): Promise<void>;
  /** Extra seam: unknown fields the ported plugin may use (spies). */
  readonly extra: Record<string, unknown>;
}

/** Extras bag: arbitrary spy seams plus the typed `sessionApi` seam. */
export interface MockCtxExtras extends Record<string, unknown> {
  sessionApi?: Record<string, unknown>;
}

/** Factory return type: destructured by test consumers. */
export interface MockCtxFactory {
  readonly createMockCtx: (extras?: MockCtxExtras) => MockCtx;
  readonly tick: (rounds?: number) => Promise<void>;
  readonly beforeEvent: (tool: string, input: unknown) => Record<string, unknown>;
  readonly afterEvent: (tool: string, input: unknown) => Record<string, unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
}

export function mockCtx(): MockCtxFactory {
  let emitted: unknown[] = [];
  let queue: unknown[] = [];

  const register = (map: Map<string, HookFn[]>) => {
    return (async (name: string, cb: HookFn): Promise<{ dispose: () => Promise<void> }> => {
      const list = map.get(name) ?? [];
      list.push(cb);
      map.set(name, list);
      return { dispose: async (): Promise<void> => undefined };
    });
  };

  const createMockCtx = (extras?: MockCtxExtras): MockCtx => {
    const toolHooks = new Map<string, HookFn[]>();
    const sessionHooks = new Map<string, HookFn[]>();
    const extra: Record<string, unknown> = { ...(extras ?? {}) };
    // Seam: v2 SessionDomain has no summarize/compact trigger (see report).
    // Coder wires the real trigger here; tests observe via this spy shape.
    const sessionApi: unknown = extra.sessionApi;
    const sessionSeam: Record<string, unknown> = isRecord(sessionApi) ? sessionApi : {};
    let waiter: (() => void) | null = null;
    let closed = false;

    const bus = {
      [Symbol.asyncIterator](): AsyncIterator<unknown> {
        let drainedInitial = false;
        void drainedInitial;
        return {
          next: async (): Promise<IteratorResult<unknown>> => {
            for (;;) {
              const next = queue.shift();
              if (next !== undefined) return { done: false, value: next };
              if (closed) return { done: true, value: undefined };
              await new Promise<void>((resolve) => {
                waiter = resolve;
              });
            }
          },
        };
      },
    };
    const ctx = {
      tool: { hook: register(toolHooks) },
      session: {
        hook: register(sessionHooks),
        ...sessionSeam,
      },
      event: { subscribe: (): unknown => bus },
      storage: {
        get: async (): Promise<undefined> => undefined,
        set: async (): Promise<void> => undefined,
        remove: async (): Promise<void> => undefined,
        scan: async (): Promise<{ items: never[] }> => ({ items: [] }),
      },
      ...extra,
    // BOUNDARY CAST: partial mock of the full v2 Context (25 domains: app,
    // location, options, agent, aisdk, command, event, experimental,
    // integration, mcp, model, generate, permission, plugin, provider,
    // reference, rpc, session, shell, skill, storage, tool, vcs, websearch,
    // worktree — e.g. SessionDomain alone Picks 13 methods with generated
    // input/output types). Fully stubbing every domain with correctly-typed
    // no-ops is brittle against SDK updates and would lie about untested
    // surface; the mock only needs tool/session/event/storage + spy seams.
    } as unknown as Context;

    return {
      ctx,
      toolHooks,
      sessionHooks,
      emitted,
      extra,
      emit(event: unknown): void {
        emitted = [...emitted, event]
        queue = [...queue, event]
        const w = waiter;
        waiter = null;
        w?.();
      },
      closeEvents(): void {
        closed = true;
        const w = waiter;
        waiter = null;
        w?.();
      },
      async runToolHook(name: string, event: Record<string, unknown>): Promise<void> {
        for (const fn of toolHooks.get(name) ?? []) await fn(event);
      },
      async runSessionHook(name: string, event: Record<string, unknown>): Promise<void> {
        for (const fn of sessionHooks.get(name) ?? []) await fn(event);
      },
    };
  };

  /** Let a background `for await (ctx.event.subscribe())` loop observe emits. */
  const tick = async (rounds = 5): Promise<void> => {
    for (let i = 0; i < rounds; i++) await Bun.sleep(0);
  };

  /** Minimal v2 tool execute.before event. */
  const beforeEvent = (tool: string, input: unknown): Record<string, unknown> => {
    return { tool, sessionID: "ses-test", agent: "build", messageID: "msg-1", id: "call-1", input };
  };

  /** Minimal v2 tool execute.after event. */
  const afterEvent = (tool: string, input: unknown): Record<string, unknown> => {
    return {
      tool,
      sessionID: "ses-test",
      agent: "build",
      messageID: "msg-1",
      id: "call-1",
      input,
      status: "completed",
      result: { title: "ok" },
    };
  };

  return { createMockCtx, tick, beforeEvent, afterEvent };
}
