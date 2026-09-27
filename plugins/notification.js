import { Plugin } from "@opencode/plugin";

/**
 * Session-done notification plugin (v2 API).
 *
 * Notifies (macOS notification + sound) once per idle after substantive tool
 * work. Serena startup/orchestration tool noise never notifies.
 *
 * v1 -> v2 mapping:
 * - v2 ctx has no `$`; use the injected `$` seam when present (tests inject a
 *   hermetic spy), else fall back to `Bun.$`.
 * - macOS-only commands (osascript/afplay) are skipped on other platforms on
 *   the real path; the injected seam is always honored (platform-safe spy).
 * - `tool.execute.after` is a single event; the tool name is `event.tool`.
 * - v1 `event` hook -> background `for await (ctx.event.subscribe())` loop.
 */

/** @typedef {import("@opencode/plugin").Plugin.Context} Ctx */

export const SERENA_STARTUP_TOOL_NAMES = new Set([
  "activate_project",
  "check_onboarding_performed",
  "initial_instructions",
  "serena_activate_project",
  "serena_check_onboarding_performed",
  "serena_initial_instructions",
]);

/** @param {unknown} toolName @returns {boolean} */
const isSerenaStartupTool = (toolName) => {
  if (typeof toolName !== "string") {
    return true;
  }

  const normalizedToolName = toolName.toLowerCase().replace(/[^a-z0-9]+/g, "_");

  return SERENA_STARTUP_TOOL_NAMES.has(normalizedToolName);
};

export default Plugin.define({
  id: "notification",
  /** @param {Ctx} ctx */
  async setup(ctx) {
    let hasSubstantiveToolWork = false;
    let stopped = false;
    /** @type {Array<{ dispose?: () => unknown }>} */
    const registrations = [];

    /**
     * @param {(strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>} run
     */
    async function notify(run) {
      try {
        await Promise.all([
          run`osascript -e 'display notification "Done !" with title "OpenCode"'`,
          run`afplay /System/Library/Sounds/Glass.aiff`,
        ]);
      } catch {
        // Notification failures should not break OpenCode event handling.
      }
    }

    async function notifyOnIdle() {
      if (!hasSubstantiveToolWork) return;
      hasSubstantiveToolWork = false;

      const seam =
        typeof ctx === "object" &&
        ctx !== null &&
        /** @type {Record<string, unknown>} */ (ctx).$;
      if (typeof seam === "function") {
        // Injected `$` seam (hermetic spy in tests) — always honored.
        await notify(seam);
        return;
      }
      // Real path: macOS-only commands; skip elsewhere.
      if (process.platform !== "darwin") return;
      await notify(Bun.$);
    }

    registrations.push(
      await ctx.tool.hook("execute.after", async (event) => {
        if (stopped) return;
        if (isSerenaStartupTool(event?.tool)) return;
        hasSubstantiveToolWork = true;
      }),
    );

    // Background event consumption (v1 `event` hook port).
    void (async () => {
      try {
        const stream = ctx.event.subscribe();
        for await (const raw of stream) {
          if (stopped) break;
          if (
            typeof raw === "object" &&
            raw !== null &&
            /** @type {Record<string, unknown>} */ (raw).type === "session.idle"
          ) {
            await notifyOnIdle();
          }
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
