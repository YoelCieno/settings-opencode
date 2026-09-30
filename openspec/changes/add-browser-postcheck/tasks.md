# Tasks

## 1. Probe command

- [x] 1.1 Create `commands/probe.md` — workflow: require URL arg (else ask), check bun ≥1.3.12, run Bun.WebView one-shot (navigate → collect console errors → title → screenshot), report format (title, error list w/ locations, screenshot path), unreachable-URL failure mode; verify file exists
- [x] 1.2 Register `probe` command in `opencode.jsonc` (`{file:commands/probe.md}\n\n$ARGUMENTS`) + `$ARGUMENTS` at end; verify `jq`/JSONC parse passes and `opencode` loads command without schema errors
- [x] 1.3 Manual RED→GREEN check: run `/probe https://example.com` → title "Example Domain", 0 console errors, screenshot produced; run `/probe` with no arg → asks for URL

## 2. Apply wrapper + postcheck

- [x] 2.1 Create `commands/apply-postcheck.md` — conditional step: detect UI-affecting tasks from this session, find dev-server URL (known/ask), run probe on changed route, include console errors in completion report; non-UI → state "postcheck N/A"; verify file exists
- [x] 2.2 Register `apply` command in `opencode.jsonc` with composed template `{file:.opencode/references/opsx/opsx-apply.md}` + `{file:commands/apply-postcheck.md}` + `$ARGUMENTS`; verify JSONC parse passes and invocation renders both blocks (opsx body first, postcheck appended)

## 3. Integration verification

- [x] 3.1 Non-UI dry run: `/apply` on a config/docs-only change → postcheck skipped with "N/A" note, opsx flow completes normally
- [x] 3.2 UI dry run (forma-initiale or local page): `/apply` completes UI task → probe runs on changed route, console errors + screenshot in completion report; failing console errors surface as failure
- [x] 3.3 Regen safety: after `/apply`, `git status --porcelain .opencode/references/opsx/` is empty (zero vendored-file edits)
- [x] 3.4 Stock workflow preserved: `/opsx:apply` runs without any postcheck content injected
