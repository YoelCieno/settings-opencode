# Best web debugger browser for OpenCode: Playwright MCP vs Bun.WebView (vs built-in / chrome-devtools-mcp)

Date: 2026-09-30
Mode: deep-dive, single topic. Research only, no code changed.

## 1. Motivation

Need an agent-drivable browser inside OpenCode for **debugging** web pages: console errors,
network failures, DOM inspection, screenshots, perf/heap. Two candidate directions:

- **Playwright MCP** — the standard agent-browser integration everyone recommends.
- **Bun WebView** — user runs bun 1.4.2 (≥1.3.12), so the runtime's *built-in* headless
  browser (`Bun.WebView`) is available with zero dependencies.

Question: which is the better "web debugger browser" *for this OpenCode setup*?

## 2. Core concepts

- **CDP (Chrome DevTools Protocol)** — the wire protocol every option below ultimately speaks.
  Whoever owns the CDP session owns debugging (console, network, heap, trace).
- **MCP server** — external process exposing typed tools to the LLM. Cost = tool tokens in
  every context + process spawn per session.
- **Snapshot/ref model** — agent navigates by accessibility snapshot + element refs instead of
  coordinates/CSS selectors. Playwright MCP pioneered it; OpenCode built-in browser uses the same model.
- **Headless vs headed** — headed lets the human watch/debug alongside the agent (DISPLAY=:0 exists
  on this box); headless is required for servers/CI.
- **Attach vs spawn** — spawning a fresh browser per session vs connecting to an already-running
  Chrome (`--cdp-endpoint`, `--browserUrl`, `--autoConnect`, `chrome://inspect` toggle).

## 3. The four options

### A. OpenCode built-in `browser.*` tools (45 tools) — already in this session

Present in the tool catalog: `browser.tabs.open`, `snapshot`, `click`, `fill`, `fill_form`,
`select`, `press`, `scroll`, `wait`, `find`, `evaluate`, `console`, `network.list/get`,
`heap.snapshot/summary/query/compare`, `trace.start/stop/analyze`, `cpu.start/stop/analyze`,
`lighthouse`, `dialog`, `drag`, `frames`, `files.*`, `preview`, `screenshot`.

- Debug-grade depth (heap + trace + CPU + Lighthouse) *without any MCP install*.
- Renders in the desktop app's **Review pane**; the human sees what the agent sees.
- **Empirically unavailable here**: calling `browser.tabs.open` returned
  `[browser.disconnected] No desktop browser is connected to this session. Open this session in
  the desktop app, enable the experimental browser setting, and wait for it to connect.`
- Verdict: best-in-class *when* the session runs in the OpenCode desktop app with the
  experimental browser setting on. Useless for TUI/SSH/CI sessions.

### B. Playwright MCP (`npx @playwright/mcp@latest`) — automation-first

Verified locally: cold `npx` run **2.1 s**, warm **1.0 s** (`--help`).

Key flags (from live `--help`, not docs guesses):

| Flag | Use |
| --- | --- |
| `--headless` | headed is the **default** — must pass on servers |
| `--browser chrome\|firefox\|webkit\|msedge` | use installed Chrome → no browser download |
| `--caps vision,pdf,devtools` | opt-in tool groups; `devtools` adds tracing + video + pause/step (`browser_resume`) |
| `--cdp-endpoint` / `--endpoint` / `--extension` | attach to a running browser |
| `--isolated` | in-memory profile, nothing persisted |
| `--console-level error\|warning\|info\|debug` | bound console noise |
| `--idle-timeout` | browser closes after idle (1 h headless default) → relaunch on next call |
| `--codegen none` | kill codegen output |

Strengths: deterministic ref-based flows, cross-browser, accessibility snapshots, best "act like
a user" surface. Weakness: telemetry-light — basic network/console only, not a real debugger.
Community consensus: *"Playwright drives, DevTools debugs."*

### C. chrome-devtools-mcp (`npx chrome-devtools-mcp@latest`) — debugging-first

Verified locally: cold **1.7 s**. Chrome-team official server, CDP-faithful.

Notable flags: `--slim` (3 tools: navigate/eval/screenshot), `--categoryPerformance/--categoryNetwork/--categoryDebugging/--categoryMemory` (fine-grained tool gating),
`--browserUrl` / `--wsEndpoint` / `--autoConnect` (attach to running Chrome), `--headless`,
`--isolated`, `--memoryDebugging`, `--screenshotFormat jpeg --screenshotMaxWidth` (context-size
control), `--redactNetworkHeaders`.

Strengths: perf traces, request waterfalls, source-mapped console stack traces, Lighthouse, heap.
Weakness: Chrome-only, larger tool surface, image-heavy output unless resized.

### D. Bun.WebView (`bun` 1.4.2) — zero-dep, script-driven

Docs: bun.com/docs/runtime/webview (experimental API).

**Empirically verified on this box** (`/tmp/opencode/wv-test.ts`):

```ts
await using view = new Bun.WebView({ backend: { type: "chrome" } });
await view.navigate("https://example.com");
const title = await view.evaluate("document.title");
await Bun.write("/tmp/opencode/wv.png", await view.screenshot());
// → {"title":"Example Domain","ms":7996,"url":"https://example.com/"}
```

API surface: `navigate/goBack/goForward/reload`, `evaluate(expr)` (JSON round-trip, awaited
promises OK), `click(coords|selector)` (actionability wait: exists → non-zero box → in viewport →
stable 2 frames → topmost), `type` (InsertText, `isTrusted: true`, **no keydown/keyup**), `press`,
`scroll/scrollTo`, `resize`, `screenshot` (png/jpeg/webp, blob/buffer/base64/shmem), console
capture handler, `cdp(method, params)` + `addEventListener("Network.responseReceived")` raw CDP,
`dataStore: { directory }` for persistent cookies, `Bun.WebView.closeAll()`.

Platform facts (Linux): backend `"chrome"` only; searches `path` → `BUN_CHROME_PATH` → `$PATH` →
install dirs → Playwright cache (`chrome-headless-shell`). Bun either spawns headless Chrome
(`--remote-debugging-pipe`) **or auto-connects to an already-running Chrome** if a
`DevToolsActivePort` file exists. One browser per Bun process; each view = new tab.
Constraints: `headless: false` throws; **one op in flight per slot** (navigate/evaluate/screenshot/
cdp/simple) — must `await` everything, second concurrent call = `ERR_INVALID_STATE`; only `cdp()` on
Chrome backend (WebKit/macOS has no CDP).

Strengths: no MCP, no npm install, no tool-token cost, raw CDP for anything missing, deterministic
one-shot scripts the agent can run via `bash`. Weakness: not interactive — each script is a fresh
process (≈8 s cold Chrome spawn), no ref/snapshot model, no human-visible tab unless you write one,
experimental API.

## 4. Key findings

1. **Already-present best debugger = OpenCode's built-in browser tools**, but they need the
   desktop app + experimental browser setting; they are `browser.disconnected` in this session.
2. **Bun.WebView works right now** — 8 s first run incl. Chrome spawn; Chrome 154 at
   `/usr/bin/google-chrome`, `DISPLAY=:0` present. Zero install, zero context cost.
3. **Playwright MCP is not a debugger** — it is an automation driver; its `--caps=devtools` is the
   only debugging add-on, and it still lacks heap/coverage/waterfall depth.
4. **chrome-devtools-mcp is the actual "web debugger browser" MCP** — first-party CDP, perf traces,
   heap (`--memoryDebugging`), console with source maps, Lighthouse, `--slim` for context control.
5. Both MCPs start fast via npx on this box (1–2 s cold, ~1 s warm) — the context7-style
   `bunx @latest` race is *not* observed with npx here, but pinning versions is still safer than
   `@latest` (registry check on every spawn + silent breaking changes).
6. Both MCPs default to **headed** (playwright) / **headless:false** (chrome-devtools) → must pass
   `--headless` for server/CI use, else they fight over DISPLAY or fail with no X.
7. MCP tool cost is real: playwright MCP adds ~30+ tools to every context. OpenCode supports
   `tools: { "mcpname*": false }` glob-disable globally + re-enable per agent — same pattern this
   repo already uses for agent tool gating.

## 5. Relation to this codebase

- Config file: `opencode.jsonc`. V2 shape is `mcp.servers` (local schema is patched:
  `./schema/opencode.config.json`, comment notes published schema still describes V1). Existing
  entries: `context7` (`{env:CONTEXT7_MCP_BIN}`, local), `serena`, `Figma` (remote, disabled).
  → new browser MCPs must go under `mcp.servers` with `"type": "local"`, not the flat V1 `mcp.<name>`.
- `context7` precedent in project memory: never `bunx @latest` for MCP spawn (install-per-spawn +
  concurrent spawns → `ENOENT` cache race → `Connection closed`). Same rule applies to browser MCPs:
  prefer a pinned command, ideally a preinstalled binary, not `@latest` on every session start.
- `e2e-runner` agent (`prompts/agents/e2e-runner.txt`) + `commands/e2e.md` already own Playwright
  **test** runs (`npx playwright test`, `--headed`, `--debug`, `--trace on`, `show-report`).
  → For repeatable E2E, the test CLI is already the tool; adding Playwright **MCP** would duplicate it.
  MCP is for *interactive* flows the agent drives, not for CI tests.
- `agent.*.tools` maps in `opencode.jsonc` are explicit allowlists → a new `playwright_*` /
  `chrome_devtools_*` tool group must be added per agent (or a global `tools` entry) or subagents
  will not see it.
- No `browser` key anywhere in config → the built-in 45 `browser.*` tools are granted by the
  desktop app, not config; they cannot be enabled for a headless TUI session by config alone.

## 6. Actionable insights — recommended stack

**Default (debugging, this box):** use OpenCode built-in browser when in the desktop app
(enable experimental browser setting). No install.

**When session is headless/TUI and you need a real debugger:**

```jsonc
// opencode.jsonc → mcp.servers  (V2 shape, NOT mcp.<name>)
"chrome-devtools": {
  "type": "local",
  "command": ["npx", "-y", "chrome-devtools-mcp@latest", "--headless", "--slim", "--isolated"],
  // "enabled": false  → keep off by default; flip on for debug sessions
},
"playwright": {
  "type": "local",
  "command": ["npx", "-y", "@playwright/mcp@latest", "--headless", "--browser", "chrome", "--isolated", "--console-level", "error"],
}
```

- Prefer `--browser chrome` (Chrome 154 installed) → no Chromium download, no version drift.
- Gate context: `"tools": { "playwright*": false }` globally, re-enable in the specific agent's
  `tools` map (pattern already documented in OpenCode MCP docs → per-agent section).
- For deep debugging drop `--slim` and add `--categoryMemory --categoryPerformance`; keep the
  slim default for routine tasks.
- Pin versions (e.g. `chrome-devtools-mcp@0.6.0`) or preinstall globally once — avoids per-spawn
  registry hits and the class of race that already bit context7.

**Use Bun.WebView for scripted one-shot probes** (screenshot a route, assert DOM, dump network via
`cdp("Network.enable")` + `addEventListener`) run through `bash` — zero MCP, zero tool tokens:

```ts
await using view = new Bun.WebView({ backend: { type: "chrome" } }); // headless-only
await view.navigate("http://localhost:3000/login");
const errs: string[] = [];
view.addEventListener("Runtime.consoleAPICalled", e => { if (e.data.type === "error") errs.push("x"); });
await view.evaluate("document.querySelector('#submit').click()");
```

Wrap as an OpenCode skill/command (`/probe <url>`) rather than an MCP — keeps context clean.

**Do not add Playwright MCP for tests** — `e2e-runner` + `npx playwright test` already covers it.

Decision rule: *drive* → built-in browser or Playwright MCP; *debug* → built-in browser or
chrome-devtools-mcp; *script/CI probe* → Bun.WebView; *regression test* → existing Playwright test CLI.

## 7. Pitfalls

- Built-in browser: `browser.disconnected` in non-desktop sessions — don't loop retries.
- Playwright MCP headed default → invisible/failing on servers; always `--headless`.
- `--no-sandbox` needed in some containers (Chrome 154 + root) — try only if launch fails.
- Bun.WebView: `await` every call (op slots throw, don't queue); `type()` sends no keydown events
  (use `press()` for Enter); API is experimental → pin bun version expectations.
- MCP images/heap dumps blow up context → prefer `--screenshotFormat jpeg` + max-width, and bound
  console/network (`--console-level error`, small `limit`).
- Two MCPs both spawning Chrome → two profiles, two processes; pick one debugger per session.

## 8. Resources

- Bun WebView docs — https://bun.com/docs/runtime/webview
- OpenCode MCP servers docs — https://opencode.ai/docs/mcp-servers/
- Playwright MCP — https://playwright.dev/docs/getting-started-mcp , https://playwright.dev/mcp/configuration/browser-extension
- chrome-devtools-mcp — https://github.com/ChromeDevTools/chrome-devtools-mcp
- Playwright vs Chrome DevTools MCP (driving vs debugging) — https://stevekinney.com/writing/driving-vs-debugging-the-browser
- Comparison (devtools vs playwright MCP) — https://lite.ego.app/article/devtools-mcp-vs-playwright-mcp , https://aicoolies.com/comparisons/chrome-devtools-mcp-vs-playwright-mcp
- OpenCode browser-automation recipe — https://www.opencode.asia/recipes/browser-automation
- Bun.WebView launch article — https://jsdevspace.substack.com/p/bunwebview-makes-browser-automation
