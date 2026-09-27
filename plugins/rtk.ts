import { accessSync, constants, statSync } from "node:fs";
import path from "node:path";

import { Plugin } from "@opencode/plugin";

/**
 * RTK OpenCode plugin (v2 API) — rewrites commands to use rtk for token savings.
 * Requires: rtk >= 0.23.0 in PATH.
 *
 * This is a thin delegating plugin: all rewrite logic lives in `rtk rewrite`,
 * which is the single source of truth (src/discover/registry.rs).
 * To add or change rewrite rules, edit the Rust registry — not this file.
 *
 * v1 -> v2 mapping:
 * - v2 ctx has no `$`; PATH probe + rewrite run via Bun.spawnSync
 *   (no shell quoting issues, strictly typed, no `any`).
 * - `tool.execute.before` is a single event; the mutable args object is
 *   `event.input` (v1 mutated `output.args.command`).
 * - Disabled (rtk missing from PATH) = zero hooks registered.
 * - setup always returns a cleanup function.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Manual PATH probe. Bun.which() does not observe runtime PATH mutations
 * (e.g. test harnesses isolating PATH), so scan process.env.PATH directly
 * for an executable file. Returns the absolute binary path or undefined.
 */
function findOnPath(name: string): string | undefined {
  const pathEnv = process.env.PATH ?? "";
  for (const dir of pathEnv.split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir, name);
    try {
      if (!statSync(candidate).isFile()) continue;
    } catch {
      continue;
    }
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }
  return undefined;
}

function rtkAvailable(): string | undefined {
  try {
    return findOnPath("rtk");
  } catch {
    return undefined;
  }
}

function rewriteCommand(rtkBin: string, command: string): string | undefined {
  try {
    const proc = Bun.spawnSync([rtkBin, "rewrite", command]);
    if (proc.exitCode !== 0) return undefined;
    const rewritten = proc.stdout.toString().trim();
    if (rewritten && rewritten !== command) return rewritten;
    return undefined;
  } catch {
    // rtk rewrite failed — pass through unchanged
    return undefined;
  }
}

export default Plugin.define({
  id: "rtk",
  async setup(ctx: Plugin.Context) {
    let stopped = false;
    const registrations: Array<{ dispose?: () => unknown }> = [];

    const rtkBin = rtkAvailable();
    if (rtkBin === undefined) {
      console.warn("[rtk] rtk binary not found in PATH — plugin disabled");
      return async () => {
        stopped = true;
      };
    }

    registrations.push(
      await ctx.tool.hook("execute.before", async (event) => {
        if (stopped) return;
        const tool = String(event.tool ?? "").toLowerCase();
        if (tool !== "bash" && tool !== "shell") return;
        if (!isRecord(event.input)) return;

        const command = event.input.command;
        if (typeof command !== "string" || !command) return;

        const rewritten = rewriteCommand(rtkBin, command);
        if (rewritten !== undefined) {
          event.input.command = rewritten;
        }
      }),
    );

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
