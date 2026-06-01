---
description: Clean up technical debt from the last task — dead code, stale exports, config drift, untracked files, duplicates
agent: debt-cleanup
subtask: true
---

# /fix — Debt Cleanup

${ARGUMENTS}

## Debt Categories

Scan the project for these issues in priority order:

1. **Dead/Unused Code** — imports, variables, functions, files with no references
2. **Stale Generated Declarations** — stale .d.ts, auto-imports.d.ts
3. **Missing/Broken Exports** — package.json exports that don't match filesystem
4. **File Rename Without Cleanup** — old files, stale imports, stale config refs
5. **Config Drift** — tsconfig, CI, env.example out of sync
6. **Untracked New Files** — git status
7. **Inconsistent Patterns** — naming, error handling, TODOs
8. **Unconsolidated Duplicates** — hardcoded values, duplicated config

## Process

1. Read SKILL.md for detailed pattern guidance
2. Scan project for each debt category
3. Fix issues found (safe deletions, exports updates, config syncs)
4. Run verification: tests → typecheck → build → lint
5. Report what was found and fixed

## Agent: debt-cleanup
