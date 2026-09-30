# Proposal

## Why

After `opsx:apply` or plan execution, browser verification is manual: agent never checks whether changed UI actually works or throws console errors. No tooling exists in config — gap confirmed in `.opencode/references/opsx/opsx-verify.md` (artifact-match only).

## What Changes

- New `/probe <url>` command: one-shot browser check via `Bun.WebView` (console errors + screenshot + title), zero MCP, works in TUI and desktop sessions, global for any project.
- New `/apply` wrapper command: composes `opsx-apply.md` + appended postcheck block. Vendored opsx references stay untouched → regeneration-safe.
- Postcheck block: after apply/plan tasks that touch UI, run `/probe` on changed route, report console errors, fail loud.
- Fallback ladder documented, not installed: built-in `browser.*` (desktop app) > chrome-devtools-mcp > Bun.WebView. No new MCP enabled by default.
- Tier-2 E2E reuses existing Playwright (`/e2e`, `e2e-runner`) — no new tool.

## Capabilities

### New Capabilities

- `browser-verification`: on-demand browser probe (`/probe`) and post-apply browser postcheck hook for any project, without modifying vendored opsx workflow files.

### Modified Capabilities

(none — no existing specs)

## Impact

- `opencode.jsonc`: +2 commands (`probe`, `apply`)
- `commands/probe.md`, `commands/apply-postcheck.md`: new files
- `.opencode/references/opsx/*`: **unchanged** (regen-safe by design)
- No MCP, no npm install; requires bun ≥1.3.12 + Chrome (verified on this box)
- Other projects (forma-initiale etc.): benefit via global config, no per-repo changes
