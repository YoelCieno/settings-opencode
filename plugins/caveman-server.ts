import { unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { Plugin } from "@opencode/plugin";

/**
 * Caveman Server Plugin (v2 API).
 *
 * Injects caveman ultra instructions into every chat system prompt via the
 * `session.hook("context")` hook (v1 used experimental.chat.system.transform).
 * Still writes a flag file so the TUI sidebar knows it's active.
 */

const CAVEMAN_INSTRUCTION = [
  "Use caveman ultra mode for this entire session.",
  "",
  "Respond terse like smart caveman. Keep full technical accuracy. Cut fluff.",
  "",
  "Rules:",
  "- Drop articles, filler, pleasantries, hedging",
  "- Fragments OK",
  "- Use short technical abbreviations like DB, auth, config, req, res, fn, impl when clear",
  "- Use arrows for causality when helpful: X -> Y",
  "- Keep code blocks unchanged",
  "- Quote errors exactly",
  "",
  "Exceptions — temporarily switch to normal clarity for:",
  "- Security warnings",
  "- Irreversible actions",
  "- Confusing multi-step instructions",
  "Resume caveman after clear part done.",
].join("\n");

function flagPath(sessionID: string): string {
  return path.join(os.tmpdir(), `opencode-caveman-${sessionID}.flag`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractSessionID(event: unknown): string | undefined {
  if (!isRecord(event)) return undefined;
  if (typeof event.sessionID === "string") return event.sessionID;
  const properties = isRecord(event.properties) ? event.properties : undefined;
  if (properties) {
    if (typeof properties.sessionID === "string") return properties.sessionID;
    const info = isRecord(properties.info) ? properties.info : undefined;
    if (info && typeof info.id === "string") return info.id;
  }
  return undefined;
}

function log(level: "debug" | "info" | "warn" | "error", message: string): void {
  try {
    // v2 App domain has no log endpoint (name/version/channel only).
    console.log(`[caveman] ${level}: ${message}`);
  } catch {
    // ignore logging failures
  }
}

export default Plugin.define({
  id: "caveman-server",
  async setup(ctx: Plugin.Context) {
    let stopped = false;
    const registrations: Array<{ dispose?: () => unknown }> = [];

    log("info", "Caveman ultra will be injected via session context hook");

    registrations.push(
      await ctx.session.hook("context", async (event) => {
        if (stopped) return;
        event.system.push({ type: "text", text: CAVEMAN_INSTRUCTION });
      }),
    );

    async function handleEvent(raw: unknown): Promise<void> {
      if (!isRecord(raw) || typeof raw.type !== "string") return;

      if (raw.type === "session.created") {
        const sessionID = extractSessionID(raw);
        if (!sessionID) return;

        // Write flag so TUI sidebar knows caveman is active
        try {
          writeFileSync(flagPath(sessionID), "ultra", "utf8");
        } catch {
          // non-critical
        }

        log("info", `Caveman ultra armed for session ${sessionID}`);
      }

      if (raw.type === "session.deleted") {
        const sessionID = extractSessionID(raw);
        if (!sessionID) return;

        try {
          unlinkSync(flagPath(sessionID));
        } catch {
          // absent
        }
      }
    }

    // Background event consumption (v1 `event` hook port).
    void (async () => {
      try {
        for await (const raw of ctx.event.subscribe()) {
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
