---
name: refactor-clean
description: >
  Remove dead code and consolidate duplicates. Invoked when user says "refactor",
  "clean up", "remove dead code", "consolidate duplicates". Detects unused
  exports/imports, identifies duplication, and safely removes with verification.
---

# Refactor Clean Skill

Analyze and clean up the codebase. Remove dead code, identify duplicates, and consolidate safely.

## When to Activate

- User says "refactor", "clean up", "remove dead code", "consolidate"
- After a major rename or restructuring
- Before a release or significant merge

## Detection Phase

### Manual Checks

- Unused functions (no callers)
- Unused variables
- Unused imports
- Commented-out code
- Unreachable code
- Unused CSS classes

### Analysis Approach

1. Search for usage — `grep_search` for function/variable name across codebase
2. Check exports — might be used externally (package `exports` in `package.json`)
3. Verify tests — no test depends on it
4. Document removal — commit message should explain why

## Removal Phase

### Safe Removal Order

1. Remove unused imports first
2. Remove unused private functions
3. Remove unused exported functions (check package exports map first)
4. Remove unused types/interfaces
5. Remove unused files

### Before Removing

- **Search for usage** — grep across the codebase for references
- **Check exports** — might be used externally via package.json `exports`
- **Verify tests** — no test depends on it
- **Document removal** — explain why in the commit message

## Consolidation Phase

### Identify Duplicates

- Similar functions with minor differences
- Copy-pasted code blocks
- Repeated patterns
- Hardcoded values that should be shared constants or CSS custom properties

### Consolidation Strategies

1. **Extract utility function** — for repeated logic
2. **Use shared constants / CSS custom properties** — for repeated values (`--wa-*` vars, never hardcoded literals)
3. **Extract shared test helpers** — for repeated test setup
4. **Create shared types** — for repeated interface patterns

## Verification

After cleanup (run in order):

1. `bun run test` — all tests pass
2. `bun run build` — builds successfully
3. `bun run lint` — no new lint errors
4. Manual smoke test — features work

## Report Format

```
Dead Code Analysis
==================

Removed:
- file.ts: functionName (unused export)
- utils.ts: helperFunction (no callers)

Consolidated:
- formatDate() and formatDateTime() → dateUtils.format()

Remaining (manual review needed):
- oldComponent.ts: potentially unused, verify with team
```

---

**CAUTION**: Always verify before removing. When in doubt, ask the user.
