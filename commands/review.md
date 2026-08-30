---
description: Review code, PRs, or documentation — /review [target] [--code] [--docs] [--no-tools]
agent: reviewer
subtask: true
---

# Review Command

Review code changes, pre-merge PRs, or documentation quality.

## Usage

```
/review                    Review current working tree changes
/review <target-branch>    Pre-merge review against target branch
/review --code <target>    Review + fix: dispatch coder for TDD RED→GREEN implementation
/review --docs             Review documentation quality (delegates to /update-docs)
```

## Flags

- `--code` — Dispatch the reviewed change to the `coder` subagent for TDD RED→GREEN implementation (instead of emitting a read-only report). Reviewer delegates via Task; coder writes the fix.
- `--no-tools` — Skip tsc + lint in pre-merge mode

## What You Do

1. Parse `$ARGUMENTS`: flags may appear anywhere; the remaining positional token = target branch (optional).
   - `--docs` flag → stop, tell the user to run /update-docs
   - `--code` flag → skip the read-only report. Dispatch to the `coder` subagent (Task tool) with the diff/target as the brief, instructing TDD RED→GREEN: fail-first tests, then implementation. Return coder's verification report. Do NOT write code yourself — coder does.
2. If target branch provided: run pre-merge review pipeline (diff, static review, tsc, lint, verdict).
3. If no target: run code review on current working tree changes (git diff, staged changes, recent commits).
4. Load `AGENTS.md` from repo root if it exists — project rules override defaults.
5. Emit structured report with severity table, findings, and verdict.

## Project-Specific Guidelines

Load `AGENTS.md` from repo root if present — project rules override defaults. In doubt, match codebase.
