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
| `a [message]` | `amend [message]` | Amend last commit. If message arg given, update it. Like `c` for commit — assumes already staged. |
| `as [message]` | `stage+amend [message]` | Stage + amend last commit. Like `scps` — stages then amends. |
| `bcl` | `branch-clean` | Delete local merged branches (safe: skips worktree, current, master/main/dev) |

4. Safety rules:
- Never change git config
- Never use destructive commands unless explicitly asked
- Never force-push unless explicitly asked
- Avoid `--amend` unless the `amend` subcommand is used (that IS explicit ask)
- Stage only relevant files for the requested task
- If unrelated changes exist, stop and report

## bcl (branch-clean) Workflow

Used when subcommand is `bcl`.

### Steps

1. Ask user for confirmation before deleting (destructive operation)
2. Collect merged branches:
   ```bash
   git branch --merged | grep -v -E "(^\*|master|main|dev)"
   ```
3. Exclude branches with active worktrees — git refuses to delete those anyway, but be explicit:
   ```bash
   git worktree list --porcelain | grep '^HEAD ' | sed 's|^HEAD refs/heads/||'
   ```
4. Delete matched branches:
   ```bash
   git branch --merged \
     | grep -v -E "(^\*|master|main|dev)" \
     | sed 's/^..//' \
     | grep -v -F -f <(git worktree list --porcelain | grep '^HEAD ' | sed 's|^HEAD refs/heads/||') \
     | xargs -r git branch -D
   ```
5. Report: which branches were deleted, which were skipped (and why).

## a (amend) Workflow

Used when subcommand is `a` / `amend` or `as` / `stage+amend`.

### Behavior

| Short | Stage? | Action |
|-------|--------|--------|
| `a` | No | Amend last commit (assumes already staged) — like `c` |
| `as` | Yes | Stage + amend last commit — like `scps` |

With message arg: both `a "msg"` and `as "msg"` pass `-m "msg"` to also update the message.

### Steps (`a`)

1. `git status` — check staged changes exist
2. No staged changes → report "nothing staged to amend", exit
3. Message arg? → `git commit --amend -m "<message>"`
4. No message arg → `git commit --amend --no-edit`
5. Verify: `git log --oneline -1`

### Steps (`as`)

1. `git status` — check for any changes
2. No changes → report "nothing to amend", exit
3. `git add .` — stage all relevant changes
4. Same as `a` step 3-5 above

### Important

- Amend rewrites commit hash. If already pushed, may need force-push (ask user first before `as` or message-change amend).
- Do NOT amend if last commit shared with others unless user confirms.
- `as` stages ALL changes via `git add .`. For selective staging, use `s` then `a`.

## Output

- `Branch`: current or created branch name
- `Commit`: created or proposed commit message
- `Push`: yes or no
- `Notes`: any blocker
