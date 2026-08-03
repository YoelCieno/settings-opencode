---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.vue"
---

# Coder Mandatory Rules

> These rules are part of the coder agent's hard verification gate. Violations are contract breaches.

## 1. Design Principles (from `instructions/patterns/`)

These principles govern every implementation decision. Read the full file before coding:

### KISSME — Keep It Simple, Maintainable Experience
**Full:** `instructions/patterns/kissme.md`
Simplicity as lifetime cost, not a snapshot. Every addition should make the system easier to reason about, not harder. Avoid if-else chains — prefer lookup maps, strategies, or command dispatchers.

### SINE — Simple Is Not Easy
**Full:** `instructions/patterns/sine.md`
Simple (few concepts, low cognitive load) ≠ Easy (familiar, no new learning). Choose simple over easy when maintainability matters. Accept upfront learning cost.

### POLA — Principle Of Least Astonishment
**Full:** `instructions/patterns/pola.md`
Functions/modules/APIs must behave as readers expect. Name, signature, return type, side effects form one coherent picture. No surprises. A "get" function must not mutate state.

### CBD — Compose Balanced Design
**Full:** `instructions/patterns/cbd.md`
SRP (one function, one responsibility) + MCMC/Open-Closed (maximize cohesion, minimize coupling) + Modules as First-Class Citizens (nameable, passable, testable, replaceable). Balanced against over-engineering.

### SoC + CQS — Separation of Concerns + Command-Query Separation
**Full:** `instructions/patterns/soc-cqs.md`
Every function is either a command (mutates state, returns void) or a query (returns data, zero side effects). Never both. One concern per module/function.

## 2. Type Safety — No `any`, No Casts

```typescript
// ✅ CORRECT: Proper types
function processItems(items: Item[]): Result[] { /* ... */ }

// ❌ WRONG: Using 'any'
function processItems(items: any): any { /* ... */ }

// ✅ CORRECT: Use union types, generics, or `unknown` with type guards:
function parseValue(val: unknown): string {
  if (typeof val === "string") return val;
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

// ❌ WRONG: Using 'as Type' cast
const result = data as User;

// ✅ CORRECT: Type annotation or type predicate
const result: User = data;
// OR
function isUser(val: unknown): val is User {
  return typeof val === "object" && val !== null && "id" in val;
}
```

## 3. Test File Extension — `.spec.ts` Only

- All test files MUST use `.spec.ts` extension
- NEVER use `.test.ts`
- Examples: `auth.spec.ts`, `user.service.spec.ts`, `api.spec.ts`

## 4. Follow Existing Module Structure

Before adding code, identify the existing module boundaries:

```
src/
  auth/
    auth.service.ts
    auth.controller.ts
    auth.spec.ts       ← match this structure
  users/
    users.repository.ts
    users.service.ts
```

- Match existing file organization (same directory depth, same naming pattern)
- Match existing import style (relative paths, barrel files, etc.)
- Do NOT create a new organizational pattern different from existing modules
- One concept per file — extract utilities, keep files focused (<400 lines)

## 5. TDD RED State Must Be Confirmed

- Never write implementation code unless RED tests exist and have been confirmed failing
- Run the test suite before writing implementation to verify RED state
- If no RED tests exist: STOP, report back to route through tdd-guide

## 6. Coding Style

### Immutability (CRITICAL)
ALWAYS create new objects, NEVER mutate existing ones:
```typescript
// WRONG: modifies original in-place
user.name = "New Name";
items.push(newItem);

// CORRECT: returns new copy
const updated = { ...user, name: "New Name" };
const extended = [...items, newItem];
```

### Error Handling
- Handle errors explicitly at every level — never silently swallow
- Use typed error classes or tagged unions, not generic `Error` throws
- Fail fast with clear messages — no silent `try/catch {}`

### Input Validation
- Validate all external input at system boundaries (API, user, file)
- Use schema-based validation (Zod, Yup) where available
- Never trust external data

### Code Quality Checklist (verify before reporting done)
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<400 lines, max 600)
- [ ] No deep nesting (>3 levels) — use early returns
- [ ] No hardcoded values — use named constants
- [ ] No mutation — immutable patterns only
- [ ] No `any` or `as Type` casts (see §2)
- [ ] No silent try/catch — typed errors or tagged unions
- [ ] Input validated at system boundaries (API, user, file)
- [ ] Test files use `.spec.ts` (not `.test.ts`)
- [ ] TDD RED tests confirmed failing before implementation
