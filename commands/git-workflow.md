---
description: Full git workflow with automatic PR creation stop-gate
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

If no subcommand is given, default to `cps`.

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
