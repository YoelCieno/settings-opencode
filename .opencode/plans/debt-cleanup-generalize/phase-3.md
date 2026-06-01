# Phase 3 — Command & Agent Registration

**Status:** ✅ DONE
**Last updated:** 2026-06-01

## Goal

Register `/fix` and `/improve` commands + `debt-cleanup` subagent in `opencode.jsonc`. Create command template `commands/fix.md`.

## Tasks

- [x] Add `command.fix` entry in opencode.jsonc
- [x] Add `command.improve` entry (alias to fix template)
- [x] Add `agent.debt-cleanup` subagent definition
- [x] Add `debt-cleanup` to conductor's task permission allowlist
- [x] Create `commands/fix.md` template
- [x] Create `/skills/debt-cleanup/` directory

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Agent tools? | read, write, edit, bash, grep, glob | Needs full access to scan/fix repo |
| 2 | Subtask? | Yes | Runs as subagent, returns control after |
