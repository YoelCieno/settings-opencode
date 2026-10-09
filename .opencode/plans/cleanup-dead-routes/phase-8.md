# Phase 8 — Deferred Trio (do LAST)

**Status:** ❌ PENDING
**Last updated:** 2026-10-07

## Goal

Close the deferred leftovers: integrate `apply-postcheck` flow into plan/apply surfaces, archive dead opsx commands (`ff`, `bulk-archive`), add explore/verify prompts to opsx:flow, trim remaining 0-use opsx commands. Runs LAST — depends on all prior phases settled.

## Key Constraints

- JSONC parse gate after every `opencode.jsonc` edit.
- opsx:flow must reference only existing commands after trim.
- Preview → user confirms → apply (per-command list shown before archive).
- Confirm final keep-list with user: propose+apply+flow+explore stay.

## Tasks

- [ ] **(a) apply-postcheck integration** — fold flow of archived `apply-postcheck.md` into:
  - [ ] `.opencode/plans/templates/plan-README.md` (plan-creation output)
  - [ ] `commands/plan.md`
  - [ ] `opsx:apply` completion report
- [ ] **(b) archive dead opsx** — `opsx:ff`, `opsx:bulk-archive` + their skills/refs → `.archived/`
- [ ] **(c) opsx:flow prompts** — edit `.opencode/references/opsx/opsx-flow.md`:
  - [ ] ask FIRST: "run opsx:explore first?"
  - [ ] ask at END: "run opsx:verify?"
- [ ] **(d) trim 0-use opsx commands** → archive: `archive`, `continue`, `new`, `onboard`, `sync`, `update`, `verify`
  - [ ] Confirm with user: `propose` + `apply` + `flow` + `explore` STAY
- [ ] Verify: jsonc parses; opsx:flow references only existing commands

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | apply-postcheck.md | Archive (P4) then reuse as integration source | Flow valuable, file entry dead |
| 2 | opsx keep-list | propose, apply, flow, explore (user-confirmed) | Core loop; rest 0-use |
| 3 | opsx:flow changes | Prompt-first + prompt-last | Ask user, don't auto-run |
| 4 | Order | LAST (P8) | Touches plan templates + commands edited in P3/P4 |

## Verification

- JSONC parse after each edit.
- `grep` opsx:flow command refs → all exist in `command{}`.
- `/plan` sample: output includes postcheck step.

## Notes

- Depends on P3/P4 (command surfaces stable), P5 (`.archived/` exists), P6 patterns not required but `.archived/` is.
- Evidence: 0-use opsx list from 1265-dispatch audit.
