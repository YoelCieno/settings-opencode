import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Plugin } from "@opencode/plugin";
import type { SessionRetry } from "@opencode/plugin/promise/session";

/**
 * Model-fallback OpenCode plugin (v2 API) — walks a per-agent fallback chain
 * when a retry-worthy error hits the session's current model.
 *
 * Config (fallback.json, or OC_MODEL_FALLBACK_CONFIG as authoritative path):
 *   { enabled, defaultFallback, cooldownMs, maxRetries, logging, agents: { [name]: { fallback } } }
 *
 * Behavior:
 * - retry hook: non-worthy errors / exhausted chain / cooldown / failed
 *   switchModel leave `event.decision` untouched
 * - per-session state reset on `session.deleted` / `session.removed` via a
 *   background `ctx.event.subscribe()` loop (auto-compact.js pattern)
 */

/** Model reference carried by retry events / switchModel input. */
interface ModelRef {
  readonly providerID: string;
  readonly id: string;
}

/** Row shape of `ctx.model.list().data` used for chain resolution. */
interface ModelRow {
  readonly providerID: string;
  readonly id: string;
  readonly modelID: string;
  readonly enabled: boolean;
}

/** Structural view of `SessionError.Error` for the worthiness check. */
interface RetryFailure {
  readonly type: string;
  readonly message: string;
  readonly status?: number | undefined;
}

interface FallbackConfig {
  readonly enabled: boolean;
  readonly defaultFallback: readonly string[];
  readonly cooldownMs: number;
  readonly maxRetries: number;
  readonly logging: boolean;
  readonly agents: Readonly<Record<string, readonly string[]>>;
}

interface SessionState {
  origin?: ModelRef;
  switches: number;
  lastSwitchAt: number;
}

/** Resolved config, or `warnPath` when the located file is unreadable/malformed. */
interface LoadedConfig {
  readonly config: FallbackConfig | undefined;
  readonly warnPath: string | undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is readonly string[] {
  if (!Array.isArray(value)) return false;
  return value.every((item: unknown) => typeof item === "string");
}

function readBoolean(raw: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = raw[key];
  return typeof value === "boolean" ? value : fallback;
}

function readCount(raw: Record<string, unknown>, key: string, fallback: number): number {
  const value = raw[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readAgents(raw: Record<string, unknown>): Readonly<Record<string, readonly string[]>> {
  const value = raw.agents;
  if (!isRecord(value)) return {};
  const agents: Record<string, readonly string[]> = {};
  for (const name of Object.keys(value)) {
    const entry: unknown = value[name];
    if (isRecord(entry) && isStringArray(entry.fallback)) {
      agents[name] = entry.fallback;
    }
  }
  return agents;
}

/** Defensive parse: undefined = malformed (not an object). No casts. */
function parseConfig(parsed: unknown): FallbackConfig | undefined {
  if (!isRecord(parsed)) return undefined;
  const fallback = parsed.defaultFallback;
  return {
    enabled: readBoolean(parsed, "enabled", false),
    defaultFallback: isStringArray(fallback) ? fallback : [],
    cooldownMs: readCount(parsed, "cooldownMs", 60000),
    maxRetries: readCount(parsed, "maxRetries", 2),
    logging: readBoolean(parsed, "logging", false),
    agents: readAgents(parsed),
  };
}

function loadConfigFile(file: string): LoadedConfig {
  try {
    const config = parseConfig(JSON.parse(readFileSync(file, "utf8")));
    if (config === undefined) return { config: undefined, warnPath: file };
    return { config, warnPath: undefined };
  } catch {
    return { config: undefined, warnPath: file };
  }
}

/** Path rules: env (authoritative, warn on failure) → project-local → repo root. */
function loadConfig(directory: string): LoadedConfig {
  const envPath = process.env.OC_MODEL_FALLBACK_CONFIG;
  if (envPath !== undefined && envPath !== "") return loadConfigFile(envPath);

  const projectPath = path.join(directory, "fallback.json");
  if (existsSync(projectPath)) return loadConfigFile(projectPath);

  const rootPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "fallback.json");
  if (existsSync(rootPath)) return loadConfigFile(rootPath);

  return { config: undefined, warnPath: undefined };
}

/** Error types that must never trigger a model switch (hyphenated + underscored forms). */
const NON_FALLBACK_TYPE =
  /(invalid[-_]request|invalid[-_]output|content[-_]filter|context[-_]overflow|compaction|aborted|permission|tool\.|unsupported)/;
/** Signals: retry-worthy upstream/billing failures, checked before the status gate. */
const FALLBACK_SIGNAL =
  /(rate|limit|overload|unavailable|internal|timeout|timed out|transport|socket|network|econn|fetch failed|capacity|quota|auth|model_not_found|too many|server error|funds|balance|billing|payment|insufficient|credit|top.?up|purchase|subscription)/i;

/** 4xx that must never trigger a model switch. */
const NO_FALLBACK_STATUSES = new Set([400, 405, 415, 422]);
/** Retry-worthy statuses checked before the 5xx/4xx range gate. */
const RETRY_STATUSES = new Set([402, 404, 408, 409, 425, 429]);

function isFallbackWorthy(error: RetryFailure): boolean {
  if (NON_FALLBACK_TYPE.test(error.type)) return false;
  const status = error.status;
  if (status !== undefined && NO_FALLBACK_STATUSES.has(status)) return false;
  if (FALLBACK_SIGNAL.test(error.type) || FALLBACK_SIGNAL.test(error.message)) return true;
  if (status !== undefined) {
    if (RETRY_STATUSES.has(status)) return true;
    if (status >= 500) return true;
    if (status >= 400) return false;
  }
  return false;
}

function modelKey(model: ModelRef): string {
  return `${model.providerID}/${model.id}`;
}

/** First-match lookup of a chain entry against a model row. */
function matchesEntry(model: ModelRow, entry: string): boolean {
  const slash = entry.indexOf("/");
  if (slash === -1) return model.modelID === entry || model.id === entry;

  const providerID = entry.slice(0, slash);
  const rest = entry.slice(slash + 1);
  return model.providerID === providerID && (model.modelID === rest || model.id === rest);
}

/** First enabled row matching `entry`; unresolvable entries are dropped. */
function findMatch(rows: readonly ModelRow[], entry: string): ModelRef | undefined {
  for (const row of rows) {
    if (row.enabled === false) continue;
    if (!matchesEntry(row, entry)) continue;
    return { providerID: row.providerID, id: row.id };
  }
  return undefined;
}

/** Resolve a chain against the live model list; list failure yields []. */
async function resolveChain(ctx: Plugin.Context, chain: readonly string[]): Promise<ModelRef[]> {
  let rows: readonly ModelRow[];
  try {
    const list = await ctx.model.list();
    rows = list.data;
  } catch {
    return [];
  }
  const resolved: ModelRef[] = [];
  for (const entry of chain) {
    const match = findMatch(rows, entry);
    if (match !== undefined) resolved.push(match);
  }
  return resolved;
}

function dedupeModels(models: readonly ModelRef[]): ModelRef[] {
  const seen = new Set<string>();
  const out: ModelRef[] = [];
  for (const model of models) {
    const key = modelKey(model);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(model);
  }
  return out;
}

/** Why the retry hook declined to switch (logged when `logging` is on). */
type SkipReason =
  | "disabled"
  | "error-not-fallback-worthy"
  | "max-retries"
  | "chain-exhausted"
  | "chain-unresolved"
  | "cooldown"
  | "switch-failed";

/** One line per decline; silent unless `logging` is enabled. */
function logSkip(logging: boolean, sessionID: string, reason: SkipReason): void {
  if (!logging) return;
  console.log(`[model-fallback] skip ${sessionID}: ${reason}`);
}

export default Plugin.define({
  id: "model-fallback",
  async setup(ctx: Plugin.Context) {
    let stopped = false;
    const registrations: Array<{ dispose?: () => unknown }> = [];

    const cleanup = async (): Promise<void> => {
      stopped = true;
      for (const reg of registrations) {
        try {
          await reg.dispose?.();
        } catch {
          // ignore dispose failures
        }
      }
    };

    const { config, warnPath } = loadConfig(ctx.location.directory);
    if (warnPath !== undefined) {
      console.warn(`[model-fallback] config unreadable or malformed: ${warnPath} — plugin disabled`);
    }
    if (config === undefined || !config.enabled) return cleanup;

    const states = new Map<string, SessionState>();

    registrations.push(
      await ctx.session.hook("retry", async (event: SessionRetry) => {
        if (!isFallbackWorthy(event.error)) {
          logSkip(config.logging, event.sessionID, "error-not-fallback-worthy");
          return;
        }

        const state = states.get(event.sessionID) ?? { switches: 0, lastSwitchAt: 0 };

        if (event.attempt <= 2) {
          state.switches = 0;
          state.origin = event.model;
        } else if (state.origin === undefined) {
          state.origin = event.model;
        }

        if (state.switches >= config.maxRetries) {
          logSkip(config.logging, event.sessionID, "max-retries");
          return;
        }
        if (Date.now() - state.lastSwitchAt < config.cooldownMs) {
          logSkip(config.logging, event.sessionID, "cooldown");
          return;
        }

        const chain = config.agents[event.agent] ?? config.defaultFallback;
        const resolved = await resolveChain(ctx, chain);
        if (resolved.length === 0) {
          logSkip(config.logging, event.sessionID, "chain-unresolved");
          return;
        }

        const seeded: ModelRef[] = state.origin === undefined ? [] : [state.origin];
        const cycle = dedupeModels([...seeded, ...resolved]);
        const idx = cycle.findIndex((m) => modelKey(m) === modelKey(event.model));
        const next = idx === -1 ? cycle[0] : cycle.length > idx + 1 ? cycle[idx + 1] : undefined;
        if (next === undefined) {
          logSkip(config.logging, event.sessionID, "chain-exhausted");
          return;
        }

        try {
          await ctx.session.switchModel({ sessionID: event.sessionID, model: next });
        } catch {
          logSkip(config.logging, event.sessionID, "switch-failed");
          return;
        }

        state.switches += 1;
        state.lastSwitchAt = Date.now();
        states.set(event.sessionID, state);

        event.decision = { retry: true, delay: 0 };

        if (config.logging) {
          console.log(`[model-fallback] switched session ${event.sessionID} to ${next.id}`);
        }
      }),
    );

    // Background event consumption: drop per-session state when a session dies.
    void (async () => {
      try {
        for await (const raw of ctx.event.subscribe()) {
          if (stopped) break;
          const event: unknown = raw;
          if (!isRecord(event)) continue;
          const type = event.type;
          if (typeof type !== "string") continue;
          if (type !== "session.deleted" && type !== "session.removed") continue;
          const sessionID = event.sessionID;
          if (typeof sessionID === "string") states.delete(sessionID);
        }
      } catch {
        // stream closed during shutdown — non-fatal
      }
    })();

    return cleanup;
  },
});
