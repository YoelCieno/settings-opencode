# mrsq — merge squash workflow

**Argument semantics:**

| Args | Source | Dest |
|------|--------|------|
| 0 | current branch | `main` |
| 1 (`X`) | current branch | `X` |
| 2 (`X Y`) | `X` | `Y` |

## Steps

1. `git checkout <dest>`
2. `git merge --squash <source>` — squash all commits from `<source>` not yet in `<dest>`
3. Generate commit message from `git log --oneline <dest>..<source>` or `<type>(<scope>): merge <source> into <dest>`
4. `git commit` with the generated message
5. `git push origin <dest>`
6. `git checkout <source>`
7. `git merge <dest>` — sync `<source>` with `<dest>` to advance merge base
8. Push `<source>` too if it tracks a remote: `git push origin <source>`

## Post-merge security gate (step 9)

After both pushes succeed, ASK the user:

> Run security checklist?

- If yes → load `skills/security-review/SKILL.md` and run its checklist against the merged state:
  - Run `tools/security-audit.ts` (dependency + secret + risky-pattern scan)
  - Walk the OWASP checklist items relevant to the diff
  - Report findings; if any HIGH → flag prominently and suggest blocking the sync
- If no → report merge summary (source, dest, commit hash) and done.

The dest branch is a release boundary — this gate exists because squash-merges to
`main` are the moment risky diffs become live.
