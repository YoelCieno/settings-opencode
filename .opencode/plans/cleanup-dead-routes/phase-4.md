# Phase 4 — Command Prune

**Status:** ✅ DONE
**Last updated:** 2026-10-07

## Goal

Remove 0-use commands (per 1265-dispatch db audit) from `opencode.jsonc` `command{}` + their files, plus orphan command files. Keep `/probe` and all actively used commands.

## Key Constraints

- JSONC parse gate after every `opencode.jsonc` edit.
- No config entry may point at a missing file.
- Preview → user confirms → apply.
- opsx commands untouched here (all opsx = P8).

## Tasks

- [x] Delete from config `command{}` + files: `security`
- [x] ~~Delete from config `command{}` + file: `build-fix`~~ — SUPERSEDED by P3 (rewired to skill, entry stays)
- [x] ~~Delete from config `command{}` + file: `update-codemaps`~~ — SUPERSEDED by P3 (rewired to skill, entry stays)
- [x] Delete config entry: `apply` (file `apply-postcheck.md` ARCHIVED, not deleted — reused P8)
- [x] Orphans: delete `commands/e2e.md`, `commands/memory-status.md` (skill stays)
- [x] `commands/update-deps.md` → **NOT deleted: register it** (see P6)
- [x] **KEEP:** `/probe` (user uses it), `plan`, `git`, `review`, `fix`, `tune`, `learn`, `skill-plus`, `discuss`, etc.
- [x] Verify: jsonc parses; no config entry points to missing file

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Keep `/probe` | Keep | User actively uses it |
| 2 | `apply-postcheck.md` | Archive, don't delete | P8 integration reuses flow |
| 3 | `update-deps` | Register (P6) | Feature alive, dead refs in security/git/git-workflow cmds |
| 4 | skills for deleted cmds | Stay | Skills invoked independently (e.g. tdd-guide → build-fix) |

## Verification

- JSONC parse after each edit.
- Cross-check: every `command{}` entry `template` target file exists.
- `git diff` preview shown to user before each apply.

## Notes

- Evidence: 0-use list from 1265-task db audit.
- Depends on P3 wiring (skill-first before command files die).
