---
name: git-workflow
description: >
  Use this skill for any git work: creating branches, staging, committing, pushing,
  pull requests, amending, branch cleanup. Invoked by /git, /git-workflow, or any
  git-related task. Enforces conventional commits + branch naming. Subcommand table
  (s/c/ps/scps/b/a/sa/saps/bcl); mrsq squash-merge with post-merge security gate.
  Deep workflows live in references/ — read on demand.
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
| `mrsq [source] [dest]` | `merge squash` | Squash source into dest + sync source back + post-merge security gate |

If no subcommand is given, default to `cps`.

## On-demand references

Read the matching file (relative to this SKILL.md) BEFORE executing the subcommand:

| Subcommand | Reference |
|------------|-----------|
| `mrsq` | `references/mrsq.md` — squash-merge steps + post-merge security gate |
| `a` / `sa` / `saps` | `references/amend.md` — amend flows + force-push safety |
| `bcl` | `references/branch-clean.md` — merged-branch deletion |
| commit/branch/PR format, output format | `references/conventions.md` |

## PR Stop Gate

After commit + push (bcps/bscps/cps flows), STOP and ask the user:

> Do you want to create a PR with these changes?

- If user says yes → run `gh pr create` with a compliant title and short `## Summary` body
- If no → done. Report what was committed and pushed.

## Safety Rules

- Never change git config
- Never use destructive commands unless explicitly asked
- Never force-push unless explicitly asked
- Avoid `--amend` unless the amend subcommand is used (that IS explicit ask)
- Stage only relevant files for the requested task
- If unrelated changes exist, stop and report
