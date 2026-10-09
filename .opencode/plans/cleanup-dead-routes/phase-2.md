# Phase 2 — Routing Dedup

**Status:** ❌ PENDING
**Last updated:** 2026-10-07

## Goal

Make `prompts/agents/conductor.txt` the sole routing source. Three duplicate routing tables exist (`.rules/common/agents.md`, `instructions/subagent-routing.md`, README) — delete/strip them, leave pointers.

## Key Constraints

- Preview → user confirms → apply.
- `opencode.jsonc` untouched — no parse gate.
- Keep dispatch rules + permission behavior in `instructions/subagent-routing.md`; only the routing TABLE goes.

## Tasks

- [ ] Delete `.rules/common/agents.md` entirely (stale)
- [ ] `instructions/subagent-routing.md`: strip routing table, replace with pointer: "canonical routing table: `prompts/agents/conductor.txt`" — keep dispatch rules/permission behavior
- [ ] `README.md` routing table → pointer to conductor.txt / config
- [ ] Verify: `opencode.jsonc` untouched (git diff empty for it); grep for duplicate routing tables = 0 (table markup only in conductor.txt)

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Source of truth | `prompts/agents/conductor.txt` | Actual dispatch surface; user directive |
| 2 | `.rules/common/agents.md` fate | Delete, not patch | Stale beyond repair; P1 already fixed names |
| 3 | subagent-routing.md fate | Keep file, strip table | Dispatch/permission rules still valid |

## Verification

- `git diff --stat opencode.jsonc` empty.
- Grep routing-table header rows only in `prompts/agents/conductor.txt`.

## Notes

- Depends on P1 (stale names fixed before file deleted — avoids re-debate).
