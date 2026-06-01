# Phase 4 — Clean up forma-initiale

**Status:** ✅ DONE
**Last updated:** 2026-06-01

## Goal

Remove old debt-cleanup skill and commands from `/data/sites/build-systems/forma-initiale` after verification.

## Tasks

- [x] Delete `.opencode/skills/debt-cleanup/` directory (SKILL.md + instincts.json)
- [x] Delete `.opencode/commands/fix.md`
- [x] Remove `command.fix`, `command.improve` from `.opencode/opencode.json`
- [x] Remove `agent.debt-cleanup` from `.opencode/opencode.json`
- [x] Verify no stale refs remain (grep for debt-cleanup)
