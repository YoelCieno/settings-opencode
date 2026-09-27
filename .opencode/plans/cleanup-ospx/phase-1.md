# Phase 1: Deep Clean

**Status:** ❌ Pending

## Delta

ADDED:
- skills-store/ directory (top-level, not loaded by OpenCode)
- thoughts/future/skills-store-repo.md (pencil idea: extract skills-store into separate repo)
- Scope boundary notes in commands/review.md, prompts/agents/reviewer.txt, commands/fix.md, skills/debt-cleanup/SKILL.md

MODIFIED:
- commands/research.md — strip comparison mode, deep-dive only
- skills/research/SKILL.md — strip comparison mode
- prompts/agents/researcher.txt — delete Comparison Mode section, mode detection, --compare flag; deep-dive only
- prompts/agents/reviewer.txt — delete delegator role + --code mode branch; add debt-out-of-scope boundary
- commands/review.md — remove --code flag (keep --docs, --no-tools)
- commands/fix.md — add security/bug-review out-of-scope boundary
- skills/debt-cleanup/SKILL.md — add scope boundary (route security review to /review)
- plugins-stash/README.md — remove continuous-learning-stop-hook.js entry
- README.md — update command table, remove sections for removed skills/plugins
- .gitignore — remove line 39 (skills/learned/.continuous-learning-index.json)

REMOVED (commands — file + opencode.jsonc entry):
- commands/test-coverage.md + opencode.jsonc "test-coverage" entry (~line 412)
- opencode.jsonc "improve" alias entry (reuses commands/fix.md; no separate file)

REMOVED (opencode.jsonc entry only, file KEPT dormant):
- opencode.jsonc "e2e" entry (~lines 330-335). commands/e2e.md stays.

REMOVED (skills — entire directory):
- skills/merge-cop/ — absorbed into reviewer agent; only self-refs, safe
- skills/continuous-learning/ — superseded; /learn has patterns inline at commands/learn.md:69-77
- skills/compress/ — superseded by strategic-compact
- skills/refactor-clean/ — orphaned, zero refs, overlaps debt-cleanup

REMOVED (legacy):
- .claude/ (whole dir — only contains skills/: 16 symlinks + learned-codemap-generator-hygiene)
- tui-plugins/caveman.tsx
- opencode-fallback.log
- plugins-stash/ecc-hooks.ts
- plugins-stash/continuous-learning-stop-hook.js (broken: targets skills/continuous-learning/hooks/stop.sh which does not exist)

MOVED (to skills-store/):
- skills/frontend-accessibility/ → skills-store/frontend-accessibility/
- skills/frontend-hexagonal-architecture/ → skills-store/frontend-hexagonal-architecture/
- skills/frontend-standards/ → skills-store/frontend-standards/
- skills/nodejs-clean-architecture/ → skills-store/nodejs-clean-architecture/
- .agents/skills/nodejs-best-practices/ → skills-store/nodejs-best-practices/ (NOTE: this one lives in .agents/skills/, not skills/)

## Behavior Specs

SHALL/MUST requirements:
- R1: opencode.jsonc MUST remain valid JSONC after every edit (comment-stripped JSON.parse MUST succeed).
- R2: research (command + skill + agent) MUST expose only deep-dive mode; comparison/tradeoff MUST NOT be referenced anywhere in research surfaces.
- R3: reviewer agent SHALL be read-only with no Task-dispatch/delegator role; the string "--code" MUST NOT appear in commands/review.md or prompts/agents/reviewer.txt.
- R4: /review SHALL route debt categories (dead code, stale exports, config drift, duplicates, untracked files) to /fix; /fix SHALL route security/bug/PR review to /review.
- R5: removed skills/commands SHALL have zero references remaining in opencode.jsonc, commands/, prompts/, README.md.
- R6: git-specialist and all other agents MUST be preserved (no agent removals).
- R7: plugin array MUST keep opencode-skill-creator, opencode-agent-memory, opencode-auto-fallback (auto-fallback pending post-plan research).

GIVEN/WHEN/THEN scenarios:
- S1: GIVEN commands/research.md is edited, WHEN read, THEN no comparison-mode section exists and output path .opencode/thoughts/research/YYYY-MM-DD-{topic-slug}.md is preserved.
- S2: GIVEN opencode.jsonc has the test-coverage and improve entries removed, WHEN JSONC parse runs, THEN parse succeeds and no command entry references commands/test-coverage.md.
- S3: GIVEN skills/merge-cop, skills/continuous-learning, skills/compress, skills/refactor-clean are deleted, WHEN grep runs across commands/, prompts/, opencode.jsonc, README.md, THEN no active reference remains (historical provenance metadata like "source: continuous-learning" in .opencode/skills/ learned-skill files is acceptable).
- S4: GIVEN commands/learn.md, WHEN executed, THEN it works without skills/continuous-learning because pattern categories are inline at learn.md:69-77.
- S5: GIVEN .claude/, tui-plugins/, opencode-fallback.log, plugins-stash/ecc-hooks.ts, plugins-stash/continuous-learning-stop-hook.js are deleted, WHEN grep for ecc-hooks and continuous-learning-stop-hook runs, THEN zero matches outside archive/historical docs.
- S6: GIVEN 5 skills are moved to skills-store/, WHEN glob skills/*/SKILL.md runs, THEN none of the 5 appear and skills-store/ contains all 5.

## Tasks

1A. Research strip: edit commands/research.md, skills/research/SKILL.md, prompts/agents/researcher.txt — remove comparison mode, mode detection, --compare; deep-dive only.
1B. Review strip: edit commands/review.md (remove --code, keep --docs/--no-tools), prompts/agents/reviewer.txt (delete delegator role + --code branch, add debt-route-to-/fix boundary).
1C. Fix boundary: edit commands/fix.md + skills/debt-cleanup/SKILL.md (security/bug review → /review).
1D. Command removals: delete commands/test-coverage.md; remove "test-coverage", "improve", "e2e" entries from opencode.jsonc command block. Keep commands/e2e.md file.
1E. Skill removals: rm -rf skills/merge-cop skills/continuous-learning skills/compress skills/refactor-clean.
1F. Skills-store: mkdir skills-store; move 4 from skills/ + 1 from .agents/skills/nodejs-best-practices.
1G. Pencil: create thoughts/future/skills-store-repo.md.
1H. Legacy purge: rm -rf .claude tui-plugins; rm opencode-fallback.log plugins-stash/ecc-hooks.ts plugins-stash/continuous-learning-stop-hook.js.
1I. Stash README: edit plugins-stash/README.md — remove continuous-learning-stop-hook.js line.
1J. .gitignore: remove line 39.
1K. README.md sync: command table rows (test-coverage, improve), continuous-learning/ecc-hooks/merge-cop/compress sections, plugin references at lines 313, 374, 399, 410.
1L. Verify: JSONC parse + dangling-ref greps (see phase-3).

KEEP list (do not touch): commands = ask, build-fix, discuss, fix, git, git-workflow, learn, memory-status, plan, research, review, security, skill-plus, small-plan, tdd, tune, update-codemaps, update-docs, e2e(file only). skills = ask, build-fix, caveman, caveman-commit, caveman-review, coding-standards, debt-cleanup, discuss, git-workflow, memory-status, opencode-skill-creator, openspec-behavior-specs, research, security-review, socratic-design, strategic-compact, tdd-workflow, test-coverage (skill KEPT — tdd-guide uses it), update-codemaps, update-docs, skill-from-history. KEEP: warp-rotate/, opencode.jsonc.tui-migration.bak (user reference), plugins-stash/figma-mcp-trigger.js, all agents, plugin array as-is.

## Risks

- HIGH: opencode.jsonc JSONC edit breaks parse (manual edits near command block). Mitigate: parse check after each edit.
- MEDIUM: README drift — many removed-item references scattered (lines 63, 199, 313, 341, 374, 399, 410).
- LOW: .opencode/skills/ learned-skill files keep historical "source: continuous-learning" provenance (acceptable).
