# Phase 1 — Generalized SKILL.md

**Status:** ✅ DONE
**Last updated:** 2026-06-01

## Goal

Create framework-agnostic SKILL.md at `/skills/debt-cleanup/SKILL.md` with generic debt patterns. Strip WA/hybridJS/project-specific refs from original forma-initiale version.

## Key Constraints

- No references to WA (Web Awesome), hybridJS, or forma-initiale
- Must auto-trigger on: "clean up", "fix debt", "improve quality", "technical debt"
- Generic enough for any JS/TS/Python/Rust project

## Tasks

- [x] Write SKILL.md with generalized frontmatter trigger keywords
- [x] Add generic debt pattern: Dead/Unused Code (variables, imports, files)
- [x] Add generic pattern: Missing/Broken Module Exports (package.json, pyproject.toml, etc.)
- [x] Add generic pattern: Stale Generated Declarations (d.ts, auto-imports, type stubs)
- [x] Add generic pattern: File Rename Without Cleanup (old files, stale imports)
- [x] Add generic pattern: Config Drift (tsconfig, eslint, CI config out of sync)
- [x] Add generic pattern: Untracked New Files (git status)
- [x] Add generic pattern: Inconsistent Naming Conventions
- [x] Add generic pattern: Unconsolidated Duplicates (CSS vars, constants, config)
- [x] Add generic verification gate: test → typecheck → build → lint

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Remove WA attr reflection pattern? | Yes | Too project-specific, irrelevant outside WA |
| 2 | Remove hybridJS render timing? | Yes | Framework-specific, no general equivalent |
| 3 | Keep 6 original generic patterns? | Yes | File rename, config drift, untracked files are universal |
| 4 | Add dead/unused code? | Yes | Core debt pattern missing from original |
