# Design

## Context

- `opsx:apply` = command template loading vendored `.opencode/references/opsx/opsx-apply.md` (`opencode.jsonc:357`, committed `git:723531a`). Files vendor openspec CLI output → regeneration risk if edited in place.
- `mcp.<name>.enabled` = startup-only (`web:opencode.ai/docs/mcp-servers`) → no mid-session browser attach.
- Built-in `browser.*` (45 tools) needs desktop app + experimental setting; `browser.disconnected` in TUI sessions (verified).
- `Bun.WebView` verified working on this box: chrome 154, cold run ~8 s, console capture + `cdp()` available. Research: `.opencode/thoughts/research/2026-09-30-opencode-web-debugger-browser.md`.

## Goals / Non-Goals

**Goals:**
- Console-error + screenshot check after apply/plan, zero MCP, works in TUI
- Regen-safe: zero edits to vendored opsx refs
- Global: works in forma-initiale and any other project via this config

**Non-Goals:**
- Installing chrome-devtools-mcp or Playwright MCP (fallback doc only)
- Replacing `/e2e` Playwright test flow (tier-2 stays as-is)
- Enabling built-in browser for TUI (config-impossible)

## Decisions

1. **Probe engine = Bun.WebView one-shot script via bash** over chrome-devtools-mcp.
   - Zero tool tokens, zero config, spawn exactly at stage, die after (true stage-gating — MCP `enabled` is startup-only, can't gate per stage).
   - Cost: 8 s cold Chrome, canned script. Acceptable for post-task cadence.
   - Alternative kept: built-in `browser.*` first when desktop-connected; chrome-devtools-mcp `--slim` only if probe can't explain a bug.
2. **Command template composition over editing opsx-apply.md.**
   - `"apply": { "template": "{file:.opencode/references/opsx/opsx-apply.md}\n\n{file:commands/apply-postcheck.md}\n\n$ARGUMENTS" }` → stock file untouched, postcheck appended at invocation only.
   - Alternative rejected: editing opsx-apply.md (regen churn); global `instructions` (always-on context cost, violates KISSME).
3. **Postcheck is conditional, agent-decided** — block states "run probe only if tasks touched UI + URL known; else note skip". No hard automation; keeps non-UI changes fast.
4. **Stock `/opsx:apply` untouched** — `/apply` is opt-in wrapper. Zero behavior change for existing workflows.

## Risks / Trade-offs

- [8 s cold probe per check] → acceptable at phase boundaries; probe only on UI tasks, not every task
- [Canned script misses flows needing interaction] → escape hatch: run raw `Bun.WebView` snippet or fall back to chrome-devtools-mcp; documented in probe.md
- [`{file:...}` template path resolves relative to config dir] → same pattern already used by `opsx:*` commands; same behavior expected — verify during apply task
- [bun <1.3.12 elsewhere] → probe command reports version requirement clearly instead of crashing
- [Dev server not running] → probe reports unreachable URL + how to start, does not silently pass
