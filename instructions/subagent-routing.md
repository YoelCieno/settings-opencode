# Subagent Routing Rule

## Scope

This rule applies to primary agents that have the Task tool available. If you are already running as a specialist subagent, or if Task is unavailable, do not delegate again; perform your assigned specialist task directly.

**Exception:** `tdd-guide` is permitted to Task `coder` (and only `coder`) to obtain the GREEN implementation after writing failing tests. No other subagent may re-delegate.

## First-Tool Gate

Before any direct inspection or work, decide whether the user request matches a specialist in `prompts/agents/conductor.txt`. If it matches and Task is available, your first tool call MUST be Task to that specialist.

Do not use `bash`, `read`, `write`, `edit`, or MCP tools, including Serena, before that first Task call. This rule overrides inspect-first habits and other tool-use guidance. If Task is unavailable or fails, then fall back to direct tools and report the blocker.

## Task Must Be First When

Canonical routing table: `prompts/agents/conductor.txt` (single source of truth) — match the request there, then dispatch via Task as your first tool call.

## Conductor Cannot Write Directly

The primary `conductor` agent has `write` and `edit` disabled (permissions + hook enforced). Every file change MUST go through a subagent:

- Source code -> `coder`
- Tests -> `tdd-guide` (which itself delegates impl to `coder`)
- Code review, PR review -> `reviewer`
- Docs/markdown/HTML/text -> `writer`
- Generated docs/codemaps -> `doc-updater`
- Refactor cleanup -> `debt-cleanup` (via `/fix`)
- Git operations (commit/push/PR) -> `git-specialist`

There is no "direct trivial edit" escape hatch for the primary anymore. If you find yourself wanting to edit, pick a subagent.
