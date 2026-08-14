---
description: Review code, PRs, or documentation — /review [target] [--docs] [--no-tools]
agent: reviewer
subtask: true
---

# Review Command

Review code changes, pre-merge PRs, or documentation quality.

## Usage

```
/review                    Review current working tree changes
/review <target-branch>    Pre-merge review against target branch
/review --docs             Review documentation quality (delegates to /update-docs)
```

## Flags

- `--no-tools` — Skip tsc + lint in pre-merge mode

## What You Do

1. Parse `$ARGUMENTS`: flags may appear anywhere; the remaining positional token = target branch (optional).
   - `--docs` flag → stop, tell the user to run /update-docs
2. If target branch provided: run pre-merge review pipeline (diff, static review, tsc, lint, verdict).
3. If no target: run code review on current working tree changes (git diff, staged changes, recent commits).
4. Load `AGENTS.md` from repo root if it exists — project rules override defaults.
5. Emit structured report with severity table, findings, and verdict.

## Project-Specific Guidelines

Load `AGENTS.md` from repo root if present — project rules override defaults. In doubt, match codebase.
