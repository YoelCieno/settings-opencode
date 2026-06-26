---
name: git-workflow
description: >
  Use this skill for any git work: creating branches, staging, committing, pushing,
  pull requests, amending, branch cleanup. Invoked by /git, /git-workflow, or any
  git-related task. Enforces conventional commits + branch naming. Provides subcommand
  table (s/c/ps/scps/b/a/sa/saps/bcl), amend workflows, and branch-clean safety.
---

# Git Workflow Skill

Use this skill whenever the task involves git operations.

## When to Activate

- Creating or renaming branches
- Staging changes
- Writing commit messages
- Creating commits
- Pushing branches
- Preparing pull requests
- Amending commits
- Cleaning up merged branches
- Reviewing branch names or commit message format

## Subcommands

When the user provides a subcommand (short or long form), follow the corresponding action:

| Short | Long | Action |
|-------|------|--------|
| `s` | `stage` | Stage relevant changes |
| `c` | `commit` | Draft conventional commit message and commit |
| `ps` | `push` | Push current branch to remote |
| `scps` | `commit & push` | Stage + commit + push |
| `b [name]` | `create branch [name]` | Create + switch branch. If no name given, auto-generate per convention. |
| `a [message]` | `amend [message]` | Amend last commit. If message arg given, update it. Assumes already staged. |
| `sa [message]` | `stage+amend [message]` | Stage + amend last commit. Like `sc` — stages then amends. |
| `saps [message]` | `stage+amend+push [message]` | Stage + amend + push. Like `scps` — stages, amends, then pushes. |
| `bcl` | `branch-clean` | Delete local merged branches (safe: skips worktree, current, master/main/dev) |

If no subcommand is given, default to `scps` (stage + commit + push).

## Workflow Subcommands (for /git-workflow)

| Short | Long | Behaviour |
|-------|------|-----------|
| `bcps <branch>` | `branch commit push ask` | Create branch → commit → push → ask about PR |
| `bscps <branch>` | `branch stage commit push ask` | Create branch → stage → commit → push → ask about PR |
| `cps` | `commit push ask` | Commit → push → ask about PR |
| `mrsq [source] [dest]` | `merge squash` | Squash source into dest + sync source back |

If no subcommand is given, default to `cps`.

### mrsq Workflow

**Argument semantics:**

| Args | Source | Dest |
|------|--------|------|
| 0 | current branch | `main` |
| 1 (`X`) | current branch | `X` |
| 2 (`X Y`) | `X` | `Y` |

**Steps:**

1. `git checkout <dest>`
2. `git merge --squash <source>` — squash all commits from `<source>` not yet in `<dest>`
3. Generate commit message from `git log --oneline <dest>..<source>` or `<type>(<scope>): merge <source> into <dest>`
4. `git commit` with the generated message
5. `git push origin <dest>`
6. `git checkout <source>`
7. `git merge <dest>` — sync `<source>` with `<dest>` to advance merge base
8. Push `<source>` too if it tracks a remote: `git push origin <source>`

### PR Stop Gate

After commit + push, STOP and ask the user:

> Do you want to create a PR with these changes?

- If user says yes → run `gh pr create` with a compliant title and short `## Summary` body
- If user says no → done. Report what was committed and pushed.

## Amend Workflow

### `a` (amend) — assumes already staged

1. `git status` — check staged changes exist
2. No staged changes → report "nothing staged to amend", exit
3. Message arg? → `git commit --amend -m "<message>"`
4. No message arg → `git commit --amend --no-edit`
5. Verify: `git log --oneline -1`

### `sa` (stage+amend)

1. `git add .` — stage all changes
2. `git status` — confirm what's staged
3. Message arg? → `git commit --amend -m "<message>"`
4. No message arg → `git commit --amend --no-edit`
5. Verify: `git log --oneline -1`

### `saps` (stage+amend+push)

1. `git add .` — stage all changes
2. `git status` — confirm what's staged
3. Message arg? → `git commit --amend -m "<message>"`
4. No message arg → `git commit --amend --no-edit`
5. `git push` — push to remote
6. Verify: `git log --oneline -1`

**Important:**
- Amend rewrites commit hash. If already pushed, may need force-push (ask user first before `sa` or message-change amend).
- Do NOT amend if last commit is shared with others unless user confirms.
- `sa` stages ALL changes via `git add .`. For selective staging, use `s` then `a`.

## bcl (branch-clean) Workflow

1. Ask user for confirmation before deleting (destructive operation)
2. Collect merged branches:
   ```bash
   git branch --merged | grep -v -E "(^\*|master|main|dev)"
   ```
3. Exclude branches with active worktrees:
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

## Safety Rules

- Never change git config
- Never use destructive commands unless explicitly asked
- Never force-push unless explicitly asked
- Avoid `--amend` unless the amend subcommand is used (that IS explicit ask)
- Stage only relevant files for the requested task
- If unrelated changes exist, stop and report

## Commit Convention

Every commit message must follow this format:

```text
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

When scope is not useful or not clear, this no-scope form is also valid:

```text
<type>: <short summary>
```

### Allowed Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect behavior, such as formatting
- `refactor`: Code changes that neither fix a bug nor add a feature
- `test`: Adding or correcting tests
- `chore`: Maintenance tasks such as tooling or build updates

### Commit Rules

- Prefer including a meaningful `scope` when the affected area is clear
- Omit `scope` instead of inventing one when it is not clear
- Use a concise present-tense summary
- Keep the summary focused on intent, not a file-by-file changelog
- Match the type to the actual purpose of the change

### Examples

- `feat(api): add user authentication endpoint`
- `fix(auth): prevent empty login submission`
- `chore(settings): sync opencode configuration`

## Branch Convention

Every branch name must follow this format:

```text
<type>/<scope>-<short-description>
```

### Branch Rules

- Reuse the same allowed `type` values as commits
- `scope` is required for branches
- `scope` must be a single lowercase token with letters and numbers only
- The first `-` after `/` separates `scope` from `short-description`
- Use a short kebab-case description
- Keep the branch name specific to the actual change
- If branch scope is ambiguous, ask one short question before creating the branch

### Examples

- `feat/auth-login-form`
- `fix/api-token-refresh`
- `chore/settings-git-workflow`

## Pull Request Rules

When the task includes PR creation or inspection:

- use `gh` for GitHub operations
- push the current branch with upstream tracking first if needed
- if a PR already exists for the current branch, return that URL instead of creating a duplicate
- choose the base branch from the repository default branch when available, otherwise prefer `main`, then `master`
- use a concise PR title aligned with the branch purpose and commit intent
- include a short `## Summary` section in the PR body

## Output Expectations

For git tasks, return:

- `Branch`: current or created branch name
- `Commit`: created or proposed commit message
- `Push`: yes or no
- `PR`: URL if created, otherwise `n/a`
- `Notes`: any blocker
