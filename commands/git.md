---
description: Handle git operations with enforced branch and commit conventions
agent: git-specialist
subtask: true
---

# Git Command

Handle this git task: $ARGUMENTS

## Requirements

1. Enforce the commit format exactly:

```text
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

If scope is not useful or not clear, this form is also valid:

```text
<type>: <short summary>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

2. Enforce the branch naming format exactly:

```text
<type>/<scope>-<short-description>
```

`scope` is required for branches. If scope is ambiguous, ask one short question before proposing.
`scope` must be a single lowercase token with letters and numbers only. The first `-` after `/` separates `scope` from `short-description`.

3. Subcommands (first arg determines action):

| Short | Long | Action |
|-------|------|--------|
| `s` | `stage` | Stage relevant changes |
| `c` | `commit` | Draft conventional commit message and commit |
| `ps` | `push` | Push current branch to remote |
| `scps` | `commit & push` | Stage + commit + push |
| `b [name]` | `create branch [name]` | Create + switch branch. If no name given, auto-generate per convention. |

4. Safety rules:
- Never change git config
- Never use destructive commands unless explicitly asked
- Never force-push unless explicitly asked
- Avoid `--amend` unless explicitly asked
- Stage only relevant files for the requested task
- If unrelated changes exist, stop and report

## Output

- `Branch`: current or created branch name
- `Commit`: created or proposed commit message
- `Push`: yes or no
- `Notes`: any blocker
