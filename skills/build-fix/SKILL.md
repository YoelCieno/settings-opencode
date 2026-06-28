---
name: build-fix
description: >
  Fix build, TypeScript, and lint errors with minimal changes. Invoked when
  user says "fix build", "fix type errors", "fix lint errors", or when
  the build/typecheck fails. Makes the smallest diff possible — no refactoring,
  no new features, no architectural changes.
---

# Build Fix Skill

Fix build and TypeScript errors with minimal changes. Get the build green, then stop.

## When to Activate

- Build fails (`bun run build` errors)
- Type check fails (`bun run build` — Vite+ handles TS via rolldown)
- Lint fails (`bun run lint` errors)
- User says "fix build", "fix types", "fix lint", "get build green"

## Approach

### DO:
- ✅ Fix type errors with correct types
- ✅ Add missing imports
- ✅ Fix syntax errors
- ✅ Make minimal changes
- ✅ Preserve existing behavior
- ✅ Run verification after each change

### DON'T:
- ❌ Refactor code
- ❌ Add new features
- ❌ Change architecture
- ❌ Use `any` type (unless absolutely necessary)
- ❌ Add `@ts-ignore` / `@ts-expect-error` comments
- ❌ Change business logic

## Common Error Fixes

| Error | Fix |
|-------|-----|
| Type 'X' is not assignable to type 'Y' | Add correct type annotation |
| Property 'X' does not exist | Add property to interface or fix property name |
| Cannot find module 'X' | Install package or fix import path |
| Argument of type 'X' is not assignable | Cast or fix function signature |
| Object is possibly 'undefined' | Add null check or optional chaining |

## Verification Steps

After fixes (run in order):

1. `bun run build` — should succeed (Vite+ handles TS type checking)
2. `bun run lint` — no new lint errors
3. `bun run test` — tests should still pass

If any step fails, fix the introduced issue and re-run from step 1.

---

**IMPORTANT**: Focus on fixing errors only. No refactoring, no improvements, no architectural changes. Get the build green with minimal diff.
