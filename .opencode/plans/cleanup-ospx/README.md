# cleanup-ospx

Two-phase cleanup + OpenSpec integration for settings-opencode (config repo).

| Phase | Status | Goal |
|-------|--------|------|
| 1. Deep Clean | 🔧 In Progress | Remove dead commands/skills/legacy, strip research comparison + reviewer delegator, scope boundaries, skills-store archive |
| 2. OSPX Integration | ❌ Pending | Official OpenSpec CLI, EXPANDED profile, project config |
| 3. Verification | ❌ Pending | JSONC parse, ospx E2E, dangling-ref grep, manual invocation |

Legend: ✅ Done · 🔧 In Progress · ❌ Pending · ⏸ Blocked

Decision points: D1 = figma-mcp-trigger.js v1/v2 compatibility gate (Phase 3).

## Post-plan research (pencil, out of scope)

Deferred to `thoughts/future/`:
- warp-rotate alternative: opencode2-compatible fallback plugin
- opencode-auto-fallback plugin v2 compatibility audit
- forma-initiale openspec extension (later)
