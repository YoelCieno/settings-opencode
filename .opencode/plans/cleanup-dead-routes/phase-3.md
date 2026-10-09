# Phase 3 — Skills Params + Command Dedup

**Status:** ❌ PENDING
**Last updated:** 2026-10-07

## Goal

Wire 7 collision-pair commands to their SKILL.md with `$ARGUMENTS` passthrough in `opencode.jsonc` `command{}`, then (after user smoke-test gate) delete duplicate `commands/*.md` files. Skills params first, deletion second.

## Key Constraints

- **Hard gate:** user smoke-tests arg passing (e.g. `/review --docs`-style invocation) BEFORE any file deletion.
- JSONC parse gate after every `opencode.jsonc` edit.
- Preview → user confirms → apply.

## Tasks

- [ ] In `opencode.jsonc` `command{}`, set template `{file:skills/<name>/SKILL.md}\n\n$ARGUMENTS` for the 7 collision pairs:
  - [ ] `ask`
  - [ ] `build-fix`
  - [ ] `discuss`
  - [ ] `git-workflow`
  - [ ] `research`
  - [ ] `update-docs`
  - [ ] `update-codemaps` (command file deleted in P4 anyway — still wire skill first)
- [ ] JSONC parse check
- [ ] **User smoke-test gate:** confirm args pass through (sample `/plan`-style invocation resolves)
- [ ] Delete dup `commands/*.md` for pairs that remain commands-only after P4
- [ ] Verify: jsonc parses; `/plan` sample resolves

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Template format | `{file:skills/<name>/SKILL.md}\n\n$ARGUMENTS` | Single source = SKILL.md; args preserved |
| 2 | Order | Wire → smoke-test → delete | User requirement: no deletion before proof |
| 3 | update-codemaps wiring | Wire even though file dies P4 | Consistency; avoids half-wired state |

## Verification

- JSONC parse via `jsonc-parser` (in devDeps) after each edit.
- `/plan` sample invocation resolves.
- User smoke-test sign-off recorded before deletions.

## Notes

- Depends on nothing; P4 deletes remaining 0-use command files.
- Broken config kills all sessions — parse gate non-negotiable.
