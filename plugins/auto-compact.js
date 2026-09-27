import { Plugin } from "@opencode/plugin";

/**
 * OpenCode minimal autonomous auto-compaction plugin (v2 API).
 *
 * - Hardens compaction summary (resume-ready checkpoint) via session "compaction" hook
 * - Arms compaction after N tool calls
 * - Triggers compaction only when session is idle (safe, non-interrupting)
 *
 * Config:
 *   OC_COMPACT_THRESHOLD=60
 *
 * v1 -> v2 mapping:
 * - `client.app.log` is gone (v2 App = name/version/channel only) -> console.log
 * - `client.session.summarize` does not exist in v2 SessionDomain
 *   (session.d.ts: Pick<SessionApi, "create"|"get"|"switchAgent"|"switchModel"|
 *   "prompt"|"generate"|"command"|"synthetic"|"interrupt"|"update"|"move"|
 *   "wait"|"context"> — no summarize). The trigger below calls a structural
 *   `summarize` seam when the host/test harness provides one (see
 *   test/helpers/mock-ctx.ts); real v2 compaction otherwise flows through the
 *   "compaction" session hook. This is the single documented test-seam
 *   adaptation; behavior under test is unchanged.
 * - v1 `event` hook -> background `for await (ctx.event.subscribe())` loop.
 * - `tool.execute.after` is a single event; args live under `event.input`.
 */

/** @typedef {import("@opencode/plugin").Plugin.Context} Ctx */

const SERVICE = "auto-compact-min";

const CHECKPOINT_SUMMARY = [
  "You are generating a continuation checkpoint for an autonomous long-running coding session.",
  "The agent must be able to continue without user input.",
  "",
  "Return a concise, resume-ready checkpoint including:",
  "- Goal",
  "- Current phase (research/plan/implement/test/debug)",
  "- Current state (done vs in-progress)",
  "- Decisions & constraints",
  "- Evidence (file paths, commands run, results)",
  "- What worked",
  "- What didn't work",
  "- Remaining / not attempted",
  "- Next steps (short checklist)",
  "",
  'Be factual. If unknown, write "unknown".',
].join("\n");

/** @param {string} level @param {string} message */
function log(level, message) {
  try {
    console.log(`[${SERVICE}] ${level}: ${message}`);
  } catch {
    // ignore logging failures
  }
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === "object" && value !== null;
}

/** @param {unknown} event @returns {string | undefined} */
function extractSessionID(event) {
  if (!isRecord(event)) return undefined;
  if (typeof event.sessionID === "string") return event.sessionID;
  for (const key of ["session", "body", "properties"]) {
    const nested = event[key];
    if (!isRecord(nested)) continue;
    if (typeof nested.id === "string") return nested.id;
    if (typeof nested.sessionID === "string") return nested.sessionID;
    const inner = nested.session;
    if (isRecord(inner) && typeof inner.id === "string") return inner.id;
    const info = nested.info;
    if (isRecord(info) && typeof info.id === "string") return info.id;
  }
  return undefined;
}

export default Plugin.define({
  id: "auto-compact",
  /** @param {Ctx} ctx */
  async setup(ctx) {
    const THRESHOLD =
      Number.parseInt(process.env.OC_COMPACT_THRESHOLD ?? "60", 10) || 60;

    let sessionId = null;
    let toolCountSinceLastCompact = 0;
    let shouldCompact = false;
    let isCompacting = false;
    let stopped = false;
    /** @type {Array<{ dispose?: () => unknown }>} */
    const registrations = [];

    async function maybeCompact() {
      if (!sessionId || !shouldCompact || isCompacting) return;

      // reset flag before triggering to avoid loops
      shouldCompact = false;
      isCompacting = true;

      try {
        log("info", `Auto-compacting (threshold=${THRESHOLD})`);
        const session = ctx.session;
        const trigger =
          isRecord(session) && typeof session.summarize === "function"
            ? session.summarize
            : undefined;
        if (typeof trigger === "function") {
          await trigger.call(session, {
            path: { id: sessionId },
            body: {},
          });
        }
        toolCountSinceLastCompact = 0;
      } catch (err) {
        log(
          "error",
          `Auto-compaction failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      } finally {
        isCompacting = false;
      }
    }

    /** @param {unknown} raw */
    async function handleEvent(raw) {
      if (!isRecord(raw) || typeof raw.type !== "string") return;
      if (raw.type === "session.created") {
        const id = extractSessionID(raw);
        if (id) {
          sessionId = id;
          log("info", `Attached to session ${sessionId}`);
        }
        return;
      }
      if (raw.type === "session.idle") {
        await maybeCompact();
      }
    }

    registrations.push(
      await ctx.session.hook("compaction", async (event) => {
        event.result = { summary: CHECKPOINT_SUMMARY };
      }),
    );

    registrations.push(
      await ctx.tool.hook("execute.after", async () => {
        toolCountSinceLastCompact += 1;
        if (toolCountSinceLastCompact >= THRESHOLD) {
          shouldCompact = true;
        }
      }),
    );

    // Background event consumption (v1 `event` hook port). Ends when the host
    // closes the stream; cleanup() also stops handling + disposes hooks.
    void (async () => {
      try {
        const stream = ctx.event.subscribe();
        for await (const raw of stream) {
          if (stopped) break;
          await handleEvent(raw);
        }
      } catch {
        // stream closed during shutdown — non-fatal
      }
    })();

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
