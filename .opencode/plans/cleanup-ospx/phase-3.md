# Phase 3: Verification

**Status:** ❌ Pending

## Delta

ADDED: nothing (verification only)
MODIFIED: plugins-stash/README.md (if D1 outcome = keep stashed)
REMOVED: nothing

## Behavior Specs

- R1: opencode.jsonc MUST pass JSONC parse (comment-strip + JSON.parse).
- R2: OpenSpec E2E MUST complete: /opsx:explore → /opsx:propose → /opsx:continue → /opsx:apply → /opsx:verify → /opsx:archive, with artifacts created and archived.
- R3: skill-plus --from-history SHALL resolve skills/skill-from-history/SKILL.md (commands/skill-plus.md:27).
- R4: grep for removed items (merge-cop, continuous-learning, refactor-clean, test-coverage command, improve command, ecc-hooks, tui-plugins, compress scoped to skills/ + commands/) SHALL return zero active references.
- R5: every kept command MUST have valid frontmatter with description.
- R6: /learn SHALL work without skills/continuous-learning.
- R7: PRE-VERIFY stashed plugins MUST be gated: figma-mcp-trigger.js SHALL be restored to plugins/ only if ported to v2 API (Plugin.define({ id, setup })); else left stashed with README updated.

GIVEN/WHEN/THEN:
- S1: GIVEN all phase-1/2 edits, WHEN JSONC parse runs on opencode.jsonc, THEN it succeeds.
- S2: GIVEN grep runs for removed-item names across opencode.jsonc, commands/, prompts/, skills/, README.md, THEN zero active references (historical provenance metadata acceptable).
- S3: GIVEN figma-mcp-trigger.js inspected, IF it uses v1 API, THEN it stays in plugins-stash/ and README lists 1 entry; IF v2, THEN restored to plugins/ and stash README lists 0 plugin entries (README retained or removed per outcome).
- S4: GIVEN /opsx:archive runs on test change, WHEN complete, THEN change moved to archive and no orphaned files remain.

## Tasks (ordered)

PRE-VERIFY:
3.0. D1 gate: inspect plugins-stash/figma-mcp-trigger.js for v2 API compat. Restore if v2, else leave stashed + update plugins-stash/README.md.

VERIFY:
3.1. JSONC parse check on opencode.jsonc.
3.2. OpenSpec E2E: test change through explore → propose → continue → apply → verify → archive.
3.3. skill-plus --from-history resolution check.
3.4. Dangling-ref greps for all removed items.
3.5. /learn manual invocation test.
3.6. Frontmatter validation on all kept commands.
3.7. README.md sync confirmation.

## Decision Points

- D1: figma-mcp-trigger.js v1 or v2? (v1 → stays stashed; README says current stash is v1-incompatible, so likely stays stashed.)

## Risks

- MEDIUM: OpenCode may need restart to pick up removed skills/commands (stale cache).
- LOW: grep false positives on generic word "compress" (scope to skills/ + commands/).
