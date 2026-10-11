# Phase 8 — Deferred Trio (do LAST)

**Status:** ✅ DONE
**Last updated:** 2026-10-07

## Goal

Close the deferred leftovers: integrate `apply-postcheck` flow into plan/apply surfaces, archive dead opsx commands (`ff`, `bulk-archive`), add explore/verify prompts to opsx:flow, trim remaining 0-use opsx commands. Runs LAST — depends on all prior phases settled.

## Key Constraints

- JSONC parse gate after every `opencode.jsonc` edit.
- opsx:flow must reference only existing commands after trim.
- Preview → user confirms → apply (per-command list shown before archive).
- Confirm final keep-list with user: propose+apply+flow+explore stay.

## Tasks

- [x] **(a) apply-postcheck integration** — fold flow of archived `apply-postcheck.md` into:
  - [x] `.opencode/plans/templates/plan-README.md` (plan-creation output)
  - [x] `commands/plan.md`
  - [x] `opsx:apply` completion report
- [x] **(b) archive dead opsx** — `opsx:ff`, `opsx:bulk-archive` + their skills/refs → `.archived/`
- [x] **(c) opsx:flow prompts** — edit `.opencode/references/opsx/opsx-flow.md`:
  - [x] ask FIRST: "run opsx:explore first?"
  - [x] ask at END: "run opsx:verify?"
- [x] **(d) trim 0-use opsx commands** → archive: `archive`, `continue`, `new`, `onboard`, `sync`, `update`, `verify`
  - [x] Confirm with user: `propose` + `apply` + `flow` + `explore` STAY
- [x] Verify: jsonc parses; opsx:flow references only existing commands

## Decisions

| #   | Decision           | Choice                                         | Rationale                                         |
| --- | ------------------ | ---------------------------------------------- | ------------------------------------------------- |
| 1   | apply-postcheck.md | Archive (P4) then reuse as integration source  | Flow valuable, file entry dead                    |
| 2   | opsx keep-list     | propose, apply, flow, explore (user-confirmed) | Core loop; rest 0-use                             |
| 3   | opsx:flow changes  | Prompt-first + prompt-last                     | Ask user, don't auto-run                          |
| 4   | Order              | LAST (P8)                                      | Touches plan templates + commands edited in P3/P4 |

## Verification

- JSONC parse after each edit.
- `grep` opsx:flow command refs → all exist in `command{}`.
- `/plan` sample: output includes postcheck step.

## Notes (2026-10-11)

- User revised keep-list: keep `explore, propose, apply, verify, archive, flow, sync, update, onboard, continue, bulk-archive` (11). Trim = `new`, `ff`, only.
- `opsx:verify` stays → flow gained Phase 3 verify opt-prompt. Flow order now: explore(opt) → propose → apply → verify(opt) → archive.
- Dangling refs fixed: `/opsx-new` ×5 (onboard, update, 2 skill copies) + `/opsx-ff` ×4 (onboard, skill copy) → `/opsx-propose`.
- apply-postcheck flow folded into `opsx-apply.md` (post-apply browser check), `templates/plan-README.md` (Postcheck section), `commands/plan.md` (both flows).
- Gates: jsonc 0 · opsx = 10 · resolved = 26 cmds · flow refs ⊆ live · 0 dangling refs.

- Depends on P3/P4 (command surfaces stable), P5 (`.archived/` exists), P6 patterns not required but `.archived/` is.
- Evidence: 0-use opsx list from 1265-dispatch audit.
