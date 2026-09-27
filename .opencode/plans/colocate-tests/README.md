# Colocate Tests: Move 7 specs next to their sources

Plan date: 2026-09-27

## Phase Table

| Phase | Focus | Location | Status |
|-------|-------|----------|--------|
| 1 | Colocate specs | `phase-1.md` (NOT created — steps below) | ❌ PENDING |

> Single-phase plan. Per `conventions.md`, phase table entry normally links `phase-1.md`; here all steps live in this README (no phase file created).

## Status Marker Conventions (per `conventions.md`)

| Status | Emoji |
|--------|-------|
| COMPLETED | ✅ |
| IN PROGRESS | 🔧 |
| PENDING | ❌ |

## Goal

Colocate 7 test specs with their sources:

- 6 plugin specs `__tests__/*.spec.ts` → `plugins/` (next to `*.ts`/`*.js` plugin sources)
- `config-schema.spec.ts` → `schema/opencode.config.spec.ts`

Shared `__tests__/helpers/` stays put — referenced via relative imports. Aligns with `.rules/coder/rules.md` §4 colocated-spec rule ("match this structure": `auth.spec.ts` next to source).

## Steps

- [ ] 1. Baseline verify: `bun test` (expect 70 pass) + `npx tsc --noEmit`
- [ ] 2. `git mv` 6 plugin specs → `plugins/`
      (`startup-bootstrap`, `rtk`, `caveman-server`, `auto-compact`, `notification`, `model-fallback`)
- [ ] 3. `git mv __tests__/config-schema.spec.ts` → `schema/opencode.config.spec.ts`
- [ ] 4. Rewrite imports in moved plugin specs:
      - `../plugins/x.js` → `./x.js`
      - `./helpers/y` → `../__tests__/helpers/y`
      - Verify schema spec import depth (`../__tests__/helpers/...` → `../../__tests__/helpers/...`)
- [ ] 5. `tsconfig.json` `include` += `"schema/**/*"`
- [ ] 6. `package.json` test script → `"bun test"` (bare — recursive discovery)
- [ ] 7. Verify: `bun test` (70 pass) + `npx tsc --noEmit`
- [ ] 8. Docs: `prompts/agents/coder.txt:22` + `prompts/agents/tdd-guide.txt:17` — replace `__tests__/` with "next to source"
- [ ] 9. Grep stale `__tests__/` refs (outside `helpers/`)

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Keep shared helpers dir | `__tests__/helpers/` stays | Shared across specs; moving adds churn with no colocation benefit |
| 2 | Schema spec name | `schema/opencode.config.spec.ts` | Mirrors `schema/opencode.config.json`; §3 `.spec.ts` only |
| 3 | Test discovery | bare `bun test` | Recursive, no path arg; colocated specs auto-discovered |

## Risks

| Risk | Level | Mitigation |
|------|-------|------------|
| Import depth errors after move | MED | Caught by verify step 7 (tsc) |
| Plugin-loader glob pickup of specs | LOW | Ruled out — name-based resolve in `opencode.jsonc`, not glob |
| Bare `bun test` discovers extra files | LOW | Caught by verify step 7 (70 pass) |

## Notes

- Complexity: LOW, ~30 min.
- Single phase — all steps execute in order, no sub-docs.
- `helpers/` remains only content under `__tests__/` after step 3; step 9 confirms no stragglers.
