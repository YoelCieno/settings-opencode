---
description: Full git workflow with subcommands (bcps/bscps/cps/mrsq) and automatic PR creation stop-gate
agent: git-specialist
subtask: true
---

# Git Workflow Command

Handle this git workflow task: $ARGUMENTS

## Subcommands

| Short | Long | Behaviour |
|-------|------|-----------|
| `bcps <branch>` | `branch commit push ask <branch>` | Create branch -> commit -> push -> ask about PR |
| `bscps <branch>` | `branch stage commit push ask <branch>` | Create branch -> stage -> commit -> push -> ask about PR |
| `cps` | `commit push ask` | Commit -> push -> ask about PR |
| `mrsq [source] [dest]` | `merge squash [source] [dest]` | Squash source into dest + sync source back |

If no subcommand is given, default to `cps`.

## mrsq Workflow

Used when subcommand is `mrsq`.

### Argument semantics

| Args | Source | Dest |
|------|--------|------|
| 0 | current branch | `main` |
| 1 (`X`) | current branch | `X` |
| 2 (`X Y`) | `X` | `Y` |

### Steps

1. `git checkout <dest>`
2. `git merge --squash <source>` — squash all commits from `<source>` not yet in `<dest>`
3. Generate commit message from `git log --oneline <dest>..<source>` or `<type>(<scope>): merge <source> into <dest>`
4. `git commit` with the generated message
5. `git push origin <dest>`
6. `git checkout <source>`
7. `git merge <dest>` — sync `<source>` with `<dest>` to advance merge base for future clean squashes
8. Push `<source>` too if it tracks a remote: `git push origin <source>`

### Why git merge and not rebase

`git merge <dest>` advances the merge base shared between source and dest. Future `git merge --squash` invocations will only pick up commits made AFTER the sync. All individual commit history is preserved on source.

## Stop Gate

After commit + push, STOP and ask the user exactly:

```
Do you want to create a PR with these changes?
```

- If user says yes -> run `gh pr create` with a compliant title and short `## Summary` body
- If user says no -> done. Report what was committed and pushed.

## Commit Format

Must follow Conventional Commits:

```text
<type>(<scope>): <short summary>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Branch Format

```text
<type>/<scope>-<short-description>
```

`scope` is required for branches. If scope is ambiguous, ask before creating.
`scope` must be a single lowercase token with letters and numbers only.

## Output

- `Branch`: created or current branch name
- `Commit`: commit message
- `Push`: yes or no
- `PR`: URL if created, otherwise `n/a`
- `Notes`: any blocker
