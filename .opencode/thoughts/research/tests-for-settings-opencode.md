# Tests for settings-opencode

Personal config repo. No tests exist. Adding KISSME tests to catch regressions.

## Tier 2: Bash Watcher (priority)

Script: `warp-rotate/opencode-auto-fallback-watcher.sh`  
Monitors fallback.log for rate-limit/error triggers, rotates WARP IP. Silent regression = stuck provider.

**Approach**: Inline bash assertions. No bats-core, no deps.

**Files:**
- `tests/test-lib.sh` — shared `assert_eq()` helper  
- `tests/test_should_trigger.sh` — 6 trigger keywords + negative cases  
- `tests/test_truncation.sh` — pos reset when log truncated  
- `tests/test_cooldown.sh` — elapsed time check  
- `tests/run-all.sh` — single entry point, pass/fail report  

**Refactor**: Make `COOLDOWN_SEC` overridable via env (like `FALLBACK_LOG` already is).

## Tier 1: Python (simple, alongside)

Files: `compress/scripts/detect.py`, `compress/scripts/validate.py`  
Pure classification + validation logic. Regression = wrong files compressed or valid compression rejected.

**Approach**: pytest (no config).

**Files:**
- `tests/test_detect.py` — 8-10 tests: extension classification, content detection, `.original.md` skip
- `tests/test_validate.py` — 6-8 tests: heading/URL/code-block extraction, full validate flow
- `tests/fixtures/` — sample markdown files

## Not Worth Testing

- `compress.py` — Claude API calls, mock-heavy
- `install.sh` — interactive, heavy side effects
- `codemaps/generate.ts` — I/O codegen
- Plugins — OpenCode SDK bound

## Order

1. `test-lib.sh` + `test_should_trigger.sh`
2. `test_truncation.sh` + `test_cooldown.sh`
3. `test_detect.py`
4. `test_validate.py`
