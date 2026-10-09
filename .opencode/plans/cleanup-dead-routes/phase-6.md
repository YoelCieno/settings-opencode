# Phase 6 — Config Cleanup

**Status:** ❌ PENDING
**Last updated:** 2026-10-07

## Goal

Purge committed credential (`service.json`), register the missing-but-alive `/update-deps` command, and archive dead-config features (`ocx.jsonc`, `dcp.jsonc`, `profiles/`).

## Key Constraints

- **HIGH RISK: `service.json` contains plaintext server password committed to git.**
  - `git rm --cached service.json` + add to `.gitignore`.
  - History purge (if user opts) = **irreversible → user decision**.
  - **User MUST rotate the password.**
  - opencode may regenerate the file locally — fine, just never track again.
- JSONC parse gate after every `opencode.jsonc` edit.
- Preview → user confirms → apply.

## Tasks

- [ ] **Credential purge:** `git rm --cached service.json`; add `service.json` to `.gitignore`; warn user: **rotate the password**
- [ ] Register missing command in `opencode.jsonc`:
      `"update-deps": { "template": "{file:commands/update-deps.md}\n\n$ARGUMENTS" }`
      → fixes dead `/update-deps` refs in `commands/security.md:93`, `commands/git.md:142`, `commands/git-workflow.md:91`
- [ ] Keep `update-deps.config.json` (feature alive, triggers A+B)
- [ ] Archive dead-config features → `.archived/`: `ocx.jsonc`, `dcp.jsonc`, `profiles/` (whole dir — depends on uninstalled `ocx` CLI)
- [ ] Keep: `cli.json`, `tui.json`, `fallback.json`, `package.json`, `tsconfig.json`, `skills-lock.json`, `opencode-skill-creator-update-check.json`
- [ ] Update README config section: remove ocx claims (L243-244, L277) or mark archived
- [ ] Verify: jsonc parses; README synced

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | service.json tracking | `git rm --cached` + gitignore | Untracks file, keeps local copy |
| 2 | History purge | USER DECISION (irreversible) | Credential in history; rewriting = force-push territory |
| 3 | update-deps | Register, don't delete | 3 live command files reference `/update-deps` |
| 4 | ocx/dcp/profiles | Archive to `.archived/` | Depend on uninstalled `ocx` CLI — dead config |

## Verification

- JSONC parse after each edit.
- `grep -rn "ocx\|dcp" README.md` → no live claims (or marked archived).
- `git ls-files service.json` → empty.

## Notes

- **Rotate the password.** Untracking ≠ secret revoked — git history still holds old copies unless user elects purge (irreversible).
- Depends on P5 (`.archived/` must exist).
