---
description: Clean up technical debt from any code area — analyze via git, fix dead code, stale exports, config drift, duplicates
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
2. Accept specific file paths or module targets from user (optional)
3. If user provided specific targets, analyze git history for those files (`git log`, `git blame`, `git diff`) to reconstruct change timeline — do NOT limit analysis to "the last task", use full `git log` for targeted paths
4. Scan targets (or whole project if no targets given) for each debt category
5. Fix issues found (safe deletions, exports updates, config syncs)
6. Run verification: tests → typecheck → build → lint
7. Report what was found and fixed

## Agent: debt-cleanup
