# Phase 1 — Stale Names

**Status:** ❌ PENDING
**Last updated:** 2026-10-07

## Goal

Fix all 9 sites referencing removed agents (`debt-cleaner`, `code-reviewer`, `refactor-cleaner`) so docs/prompts point at real agents (`debt-cleanup`, `reviewer`). Pure text edits — no config changes.

## Key Constraints

- Preview each edited file section → user confirms → apply.
- `grep -rn "debt-cleaner\|code-reviewer\|refactor-cleaner"` must return 0 hits outside `archived/` (or `.archived/`).

## Tasks

- [x] `prompts/agents/conductor.txt` L53: `task → debt-cleaner` → `debt-cleanup`
- [x] `prompts/agents/conductor.txt` L114: same fix
- [x] `prompts/agents/build-error-resolver.txt` L106: `debt-cleaner` → `debt-cleanup`
- [x] `instructions/subagent-routing.md` L28 + L41: `debt-cleaner` → `debt-cleanup`
- [x] `.rules/common/agents.md` L16: row `debt-cleaner` → `debt-cleanup`; also fix wrong claim "Located in `.opencode/agents/`" → `prompts/agents/`
- [x] `.rules/common/git-workflow.md` L39: `code-reviewer` → `reviewer`
- [x] `README.md` L41, L292, L331: stale names → current agents
- [x] Verify: `grep -rn "debt-cleaner\|code-reviewer\|refactor-cleaner"` = 0 hits outside archived dirs

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Target names | `debt-cleanup`, `reviewer` | Actual agent files in `prompts/agents/` |
| 2 | Edit vs delete `.rules/common/agents.md` | Fix now, delete in P2 | Routing dedup is P2 scope |

## Verification

- Grep gate above returns 0.
- No `opencode.jsonc` edit → no parse gate needed.

## Notes

- Evidence: 9 stale-name sites from db audit (2026-10-07).
- `.rules/common/agents.md` gets deleted entirely in P2 — fix only to keep P1 self-contained.
