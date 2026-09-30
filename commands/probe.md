---
description: "One-shot browser probe: console errors, title, screenshot"
---

Probe a URL in a headless browser and report console errors + screenshot.

**Input**: `$ARGUMENTS` = URL to probe. A route path (e.g. `/dashboard`) = append to known dev-server base URL.

**Steps**

1. **URL required**: no URL → ask "Which URL should I probe?" and stop. Do not guess.
2. **Check environment**: run `bun --version` — probe requires bun ≥ 1.3.12 (Bun.WebView). If too old, report the requirement and stop. Chrome/Chromium must be installed (searched via `$PATH`).
3. **Run the probe**:
   ```bash
   bun scripts/probe.ts <url>
   ```
   In another project (cwd ≠ this repo): `bun /data/sites/ai/settings-opencode/scripts/probe.ts <url>`.
   - exit 0 → PASS
   - exit 1 → FAIL (console errors or unreachable URL)
   - exit 2 → usage/version problem (fix input, retry once)
4. **Report** to the user: verdict (PASS/FAIL), page title, error list with `source:line`, screenshot path. On FAIL, show each error verbatim — never summarize console errors away.
5. **Unreachable URL**: report the reason and how to start the dev server; do NOT retry blindly.

**Fallback ladder** (only when the script can't answer the question):
- Session in OpenCode desktop app with browser connected → use built-in `browser.*` tools (`browser.console`, `browser.evaluate`, `browser.screenshot`) for interactive drill-down.
- Need network waterfall/heap → chrome-devtools-mcp (`npx chrome-devtools-mcp@latest --headless --slim`), one-off, not added to config.
- Need interaction flows (click/type) → raw `Bun.WebView` script (`view.click()`, `view.type()`), see bun.com/docs/runtime/webview.

**Not for**: regression suites → `/e2e` (Playwright test CLI).
