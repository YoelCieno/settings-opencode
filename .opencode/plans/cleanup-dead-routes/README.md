# cleanup-dead-routes: Eliminate all dead routes in settings-opencode

Stale agent names, unwired commands, orphan files, dead configs — removed phase-by-phase with **one-by-one preview → user confirm → apply** cadence. User must see output before every change applies.

**Cadence rule (user requirement):** every phase = Preview (show diff/grep/file list) → user confirms → Apply. No exceptions.

## Phase Table

| Phase | Focus | Location | Status |
|-------|-------|----------|--------|
| 1. Stale names | Fix 9 stale agent-name sites | `phase-1.md` | ✅ Done |
| 2. Routing dedup | conductor.txt = sole routing source; delete 3 copies | `phase-2.md` | ❌ PENDING |
| 3. Skills params + command dedup | Wire 7 command templates to SKILL.md + $ARGUMENTS, then delete dup command files | `phase-3.md` | ❌ PENDING |
| 4. Command prune | Delete 0-use commands + orphan files (keep /probe) | `phase-4.md` | ❌ PENDING |
| 5. .archived/ consolidation | Create gitignored .archived/; move skills-store, plugins-stash, e2e-runner | `phase-5.md` | ❌ PENDING |
| 6. Config cleanup | service.json purge, register update-deps, archive ocx/dcp | `phase-6.md` | ❌ PENDING |
| 7. Pattern wiring | Inline KISSME+SOC into coder.txt; per-agent pattern matrix | `phase-7.md` | ❌ PENDING |
| 8. Deferred trio | apply-postcheck into plan flows; archive opsx:ff + opsx:bulk-archive; opsx:flow explore/verify prompts; trim unused opsx | `phase-8.md` | ❌ PENDING |
| 9. Close cleanup-ospx | Phases marked ✅, skills-store-repo.md marked DONE | `phase-9.md` | ✅ Done (2026-10-07) |

Legend: ✅ Done · 🔧 In Progress · ❌ PENDING

## Cross-Cutting Requirements

- **Preview → confirm → apply** gate every phase (user rule).
- **JSONC parse gate** after EVERY `opencode.jsonc` edit — broken config kills all sessions (`npx jsonc-parser` / bun script; `jsonc-parser` in devDeps).
- Dependencies: `git`, `jsonc-parser`, user confirmation per phase.

## Risk Callouts

| Risk | Level | Detail |
|------|-------|--------|
| service.json credential | **HIGH** | Plaintext server password committed to git. Purge from history = irreversible → user decision. **Rotate the password.** |
| Config parse failure | MEDIUM | Bad jsonc edit breaks all sessions. Parse after each edit. |
| Live global config | MEDIUM | Symlink `~/.config/opencode` → repo: every change hits live global config immediately. |

## Evidence

- db audit: 1265 task dispatches → stale names + command usage list below.
- `e2e-runner`: 0 uses.
- 0-use commands (from audit): security, build-fix, update-codemaps (skill stays), apply, e2e, memory-status (skill stays), update-deps (NOT deleted — registered P6).
- 9 stale-name sites (debt-cleaner / code-reviewer / refactor-cleaner) — enumerated in `phase-1.md`.
- Successor to closed plan `.opencode/plans/cleanup-ospx/`.

## Source/s

`opencode.jsonc`, `prompts/agents/conductor.txt`, `instructions/subagent-routing.md`, `.rules/common/agents.md`, `README.md`, opencode.db audit (1265 task dispatches), `.opencode/plans/cleanup-ospx/`
