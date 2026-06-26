---
name: test-coverage
description: >
  Analyze test coverage and identify gaps. Invoked when user says "check coverage",
  "test coverage", "coverage report", "find uncovered code". Prioritizes critical
  code first, generates missing tests, and provides improvement plans.
---

# Test Coverage Skill

Analyze test coverage and identify gaps. Critical code gets priority.

## When to Activate

- User says "check coverage", "test coverage", "coverage report"
- User asks to find uncovered code paths
- Before declaring a feature complete
- When CI coverage drops below threshold

## Coverage Targets

| Code Type | Target |
|-----------|--------|
| Standard code | 80% |
| Financial logic | 100% |
| Auth/security | 100% |
| Utilities | 90% |
| UI components | 70% |

## Process

1. **Run coverage report**: `bun run test -- --coverage`
2. **Analyze results** — Identify low coverage areas
3. **Prioritize gaps** — Critical code first
4. **Generate missing tests** — For uncovered code

## Coverage Report Analysis

### Summary
```
File           | % Stmts | % Branch | % Funcs | % Lines
---------------|---------|----------|---------|--------
All files      |   XX    |    XX    |   XX    |   XX
```

### Low Coverage Files
[Files below target, prioritized by criticality]

### Uncovered Lines
[Specific lines that need tests]

## Test Generation

For each uncovered area, write tests following project conventions:

- Vitest for `packages/infra`, `packages/ui`, `apps/white-label-vue`
- Test files co-located: `*.spec.ts` next to source
- Use `await Promise.resolve()` (×2) for hybridJS component render timing
- Set properties, not attributes, on `fe-*` custom elements

## Coverage Improvement Plan

1. **Critical** (add immediately)
   - [ ] file1.ts — Auth logic
   - [ ] file2.ts — Payment handling

2. **High** (add this sprint)
   - [ ] file3.ts — Core business logic

3. **Medium** (add when touching file)
   - [ ] file4.ts — Utilities

---

**IMPORTANT**: Coverage is a metric, not a goal. Focus on meaningful tests, not just hitting numbers.
