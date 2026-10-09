# Phase 7 — Pattern Wiring

**Status:** ❌ PENDING
**Last updated:** 2026-10-07

## Goal

Give agents pattern guidance without global token cost: inline compact KISSME + SOC excerpts into `prompts/agents/coder.txt`, and add one-line pattern refs to each agent per a matrix.

## Key Constraints

- **NO global injection** — pattern files must NOT be added to global `instructions[]` (token cost).
- One-line refs in respective prompt files only.
- Preview → user confirms → apply.
- No `opencode.jsonc` edit expected → no parse gate (unless instructions[] touched — forbidden).

## Tasks

- [ ] Inline compact KISSME excerpt (from `instructions/patterns/kissme.md`) into `prompts/agents/coder.txt`
- [ ] Inline compact SOC excerpt (from `instructions/patterns/soc-cqs.md`) into `prompts/agents/coder.txt`
- [ ] Per-agent matrix — add one-line refs:
  - [ ] planner/architect → read `instructions/patterns/` (KISSME, SOC, CBD) when designing
  - [ ] coder/tdd-guide/build-error-resolver → KISSME, SOC, POLA (KISSME+SOC inlined in coder.txt, POLA ref only)
  - [ ] reviewer/security-reviewer → SINE + refs
  - [ ] writer/doc-updater → POLA ref
  - [ ] conductor/others → none
- [ ] Verify: no pattern file in global `instructions[]`; refs present per matrix

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Injection scope | coder.txt inline + per-agent one-line refs | coder executes most; others only ref |
| 2 | Global instructions[] | Forbidden | Token cost on every session |
| 3 | Inlined patterns | KISSME + SOC only | Highest-value for coder; rest = refs |

## Pattern Matrix

| Agents | Patterns |
|--------|----------|
| planner, architect | KISSME, SOC, CBD — read `instructions/patterns/` when designing |
| coder, tdd-guide, build-error-resolver | KISSME, SOC inlined (coder.txt) + POLA ref |
| reviewer, security-reviewer | SINE + refs |
| writer, doc-updater | POLA ref |
| conductor, others | none |

## Verification

- `grep -n "instructions/patterns" prompts/agents/*.txt` matches matrix.
- `grep -c "patterns/" opencode.jsonc` → no new instructions[] entries.

## Notes

- Evidence: pattern files live at `instructions/patterns/{kissme,soc-cqs}.md` but were never wired to agents.
