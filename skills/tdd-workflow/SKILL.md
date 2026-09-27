# TDD Workflow Skill

## Core Rule
Always write failing RED tests before GREEN implementation.

## Routing
- No failing tests → write RED tests first
- Tests exist → implement GREEN code
- Bug fix → write regression test first
- Refactor → verify coverage first

## Verification Gate
After implementation, run independent build verification:
- TypeScript: `npx tsc --noEmit`
- Rust: `cargo check` 
- Python: `mypy .`

## Context-Bus Integration
Share test specs and results via context-bus for parallel execution.

## Pitfalls to Avoid
- Skipping RED phase
- Trusting subagent self-reports
- No independent verification

## Import Convention
- **Prefer static `import`** over dynamic `import()` in test files
- Only use `await import()` when necessary: lazy mocks, conditional loading, circular deps
- Rationale: static imports enable type-checking, autocomplete, refactoring — dynamic imports hide import errors til runtime

*Full patterns in development-patterns skill*