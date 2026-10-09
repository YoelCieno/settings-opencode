# Phase 5 — .archived/ Consolidation

**Status:** ✅ DONE
**Last updated:** 2026-10-07

## Goal

Create gitignored `.archived/` as single graveyard; move `skills-store/`, `plugins-stash/`, and all `e2e-runner` surfaces there. Removes top-level clutter without losing reference material.

## Key Constraints

- Naming: EXACTLY `.archived/skills-store` — **never** `.archived/skills/` (auto-discovery ambiguity with `skills/`).
- Use `git mv` where tracked.
- JSONC parse gate (opencode.jsonc edits for e2e-runner removal).
- Preview → user confirms → apply.

## Tasks

- [x] Create `.archived/` + add `.archived/` to `.gitignore`
- [x] `git mv skills-store/` → `.archived/skills-store/`
- [x] `git mv plugins-stash/` → `.archived/plugins-stash/`
- [x] `git mv opencode.jsonc.tui-migration.bak` → `.archived/` (stale migration backup: dead `code-reviewer`/`refactor-cleaner` config entries)
- [x] e2e-runner removal (0 uses in audit):
  - [x] `opencode.jsonc` config agent entry `e2e-runner` (L169)
  - [x] `opencode.jsonc` permission entry `"e2e-runner": "allow"` (L106)
  - [x] `git mv prompts/agents/e2e-runner.txt` → `.archived/e2e-runner/`
  - [x] `fallback.json` `agents.e2e-runner` entry
- [x] Verify: jsonc parses; `grep -r e2e-runner opencode.jsonc fallback.json` = 0

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Archive dir name | `.archived/` (dot-prefix, gitignored) | Hidden, no tool discovery, keeps git history clean |
| 2 | skills-store name | `.archived/skills-store` exactly | Never `.archived/skills/` — avoids auto-discovery ambiguity |
| 3 | Move method | `git mv` where tracked | Preserves history for un-archived recovery |

## Verification

- JSONC parse after `opencode.jsonc` edits.
- `grep -r e2e-runner opencode.jsonc fallback.json` = 0.
- `git status` shows moves, not mixed delete/add (git mv).

## Notes (2026-10-10)

- Scope additions executed with user approval:
  - `skills/git-workflow` modularized: SKILL.md 232→83 lines, deep flows → `references/{mrsq,amend,branch-clean,conventions}.md`
  - `mrsq` gained post-merge security gate (step 9: ask "Run security checklist?" → security-review skill)
  - `memory-status` recovered OpenCode-native: SKILL.md rewritten (was stale Qwen port), config entry wired → SKILL.md (commands/memory-status.md stays deleted)


- MEDIUM risk: symlink `~/.config/opencode` → repo = live global config affected immediately (e2e-runner gone from running sessions on next reload).
- `e2e-runner` has 0 uses in 1265-dispatch audit.
