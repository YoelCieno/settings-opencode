---

## Browser postcheck (appended after opsx:apply — run AFTER all tasks are marked)

Do this only when the change can be observed in a browser. Non-UI changes skip it.

1. **Decide**: did completed tasks touch UI (components, routes, styles, client behavior)?
   - No → append one line to the completion report: `Postcheck: N/A (no UI changes)` and stop.
   - Yes → continue.
2. **Resolve URL**: use the project's dev-server URL if known (config, package.json, prior session context). If unknown or server not running → append `Postcheck: skipped — no reachable app URL (start dev server and run /probe <url>)` and stop. Never guess a URL silently.
3. **Probe changed route(s)**: run `bun scripts/probe.ts <url>` (in this repo) or `bun /data/sites/ai/settings-opencode/scripts/probe.ts <url>` (elsewhere). Probe each route the change touched — not the whole app.
4. **Report**: include verdict (PASS/FAIL), console error count, errors with `source:line`, and screenshot path in the final completion report. FAIL (any console error or unreachable URL) ⇒ the change is NOT done — surface errors verbatim to the user and offer to fix.
