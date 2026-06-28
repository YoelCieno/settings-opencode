---
name: debt-cleanup
description: >
  Cleans technical debt after tasks. Invoked by /fix or /improve, or when user says "clean up", "fix debt", "improve quality", "technical debt", "tidy up", "clean after". Scans for 8 debt categories in priority order, fixes, then runs verification gate (test → typecheck → build → lint).
---

# Debt Cleanup Skill

Automatically detect and fix common technical debt after completing a task.

## When to Activate

- User says "clean up", "fix debt", "improve quality", "technical debt"
- After completing a feature implementation
- After renaming or deleting files
- After adding new dependencies
- Before declaring a task complete

## Debt Patterns (Priority Order)

### Pattern 1: Dead or Unused Code (HIGH)
```typescript
// ❌ Symptom: Declared but never referenced
const unusedVar = 42; // Never used
function oldHelper() {} // No callers

// ✅ Fix: Delete dead code
// - Check imports: are all imported symbols used?
// - Check exports: are public APIs still consumed externally?
// - Check variables, functions, classes for references
```

**Detection:**
- `grep` for unused imports (import { X } from ... where X is never used)
- Check for declared functions/variables with no references
- Look for commented-out code blocks

**Fix:** Remove dead declarations. Use safe deletion (check references first).

---

### Pattern 2: Stale Generated Declarations (HIGH)
Generated type declaration files (`.d.ts`, `auto-imports.d.ts`, `components.d.ts`) can become stale after renames, deletions, or dependency changes.

**Detection:**
- Check if generated files exist and match current source
- Look for stale type declarations referencing removed modules
- Compare generated declarations with actual exports

**Fix:** Regenerate declarations:
```bash
# Framework-dependent — pick appropriate one
npm run build:types   # or
npx vue-tsc --declaration --emitDeclarationOnly
npm run generate-types
```

---

### Pattern 3: Missing or Broken Module Exports (HIGH)
Package manifests (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`) can have stale or missing export entries after adding/renaming modules.

**Detection:**
- Check `package.json` `exports` map against actual file tree
- Verify all exported paths resolve to existing files
- Look for exported files that were renamed without updating the exports map

**Fix:** Update exports map to match actual file layout.

---

### Pattern 4: File Rename Without Cleanup (MEDIUM)
Renaming a file often leaves stale imports, old files, and broken references.

**Detection:**
- `git status --short | grep '^R\|^D\|^??'` for rename clues
- Grep for old file name references across the codebase
- Check imports in files that imported the old name
- Check router config, auto-import config, barrel exports

**Fix:**
- Delete old files if they still exist
- Update all imports to new path
- Update router, auto-imports, and any config referencing old path
- Update spec/test file imports

---

### Pattern 5: Config Drift (MEDIUM)
Configuration files can drift out of sync when packages are added, removed, or renamed.

**Detection:**
- Compare `tsconfig.json` paths with actual directory structure
- Check CI config (`.github/workflows`, `.gitlab-ci.yml`) references changed paths
- Verify ESLint/Prettier config ignores reference valid paths
- Check `.env.example` for missing/extra vars vs actual usage

**Fix:** Sync configs with actual project structure.

---

### Pattern 6: Untracked New Files (LOW)
New files might need to be tracked or `.gitignore`-d.

**Detection:**
```bash
git status --short | grep '^??'
```

**Fix:**
- Stage files that should be tracked
- Add patterns to `.gitignore` for files that should not be tracked
- Consider if the files are build artifacts, generated outputs, or intentional new sources

---

### Pattern 7: Inconsistent Naming or Patterns (LOW)
Inconsistencies accumulate over time — kebab vs camelCase files, mixed import styles, inconsistent error handling.

**Detection:**
- Check file naming consistency within directories
- Look for mixed import/require usage
- Check for inconsistent error handling patterns
- Look for TODOs and FIXMEs that should be addressed

**Fix:** Apply project conventions. Standardize to one style per project rules.

---

### Pattern 8: Unconsolidated Duplicates (LOW)
Duplicate constants, CSS values, logic blocks, or configuration that should be shared.

**Detection:**
- Grep for repeated hardcoded values (colors, spacing, URLs, timeouts)
- Check for duplicated blocks of similar code
- Look for repeated config in multiple test files

**Fix:**
- Extract to shared constants/modules
- Consolidate CSS custom properties
- Extract duplicate test setup to helpers

---

## Verification Gate (Mandatory)

After all fixes, run in order:

1. **Tests** — `npm test` or `bun test` or equivalent
2. **Typecheck** — `npx tsc --noEmit` or `mypy .` or `cargo check`
3. **Build** — `npm run build` or `bun run build`
4. **Lint** — `npm run lint` or `npx eslint .`

If any step fails:
- Fix the introduced issue
- Re-run from step 1
- Do NOT skip verification

### Pre-Verification Checklist
- [ ] Dead code removed
- [ ] Generated declarations regenerated
- [ ] Module exports up to date
- [ ] No stale file references remain
- [ ] Configs in sync with project structure
- [ ] Untracked files staged or gitignored
- [ ] Naming conventions consistent
- [ ] Duplicates consolidated
