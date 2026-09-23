# Phase 2: OSPX Integration

**Status:** ❌ Pending

## Delta

ADDED:
- openspec/ directory (specs/, changes/, config.yaml) via openspec init
- .opencode/skills/openspec-* generated skills (6)
- opencode.jsonc /opsx:* command entries

MODIFIED:
- openspec/config.yaml — project context customization

REMOVED: none

## Behavior Specs

- R1: openspec SHALL be installed/verified via official CLI (`openspec --version`; expected @fission-ai/openspec, mise shim at /home/fer/.local/share/mise/shims/openspec).
- R2: `openspec init --tools opencode` MUST run from repo root /data/sites/ai/settings-opencode.
- R3: profile MUST be EXPANDED (new, continue, ff, verify, bulk-archive, onboard + core propose/explore/apply/update/sync/archive).
- R4: `openspec update` SHALL apply expanded commands to the project.
- R5: skills/openspec-behavior-specs/ MUST be preserved and MUST NOT conflict with generated .opencode/skills/openspec-* skills.
- R6: forma-initiale's openspec/ SHALL NOT be touched (out of scope).

GIVEN/WHEN/THEN:
- S1: GIVEN openspec init completes, WHEN inspecting repo, THEN openspec/ (specs/, changes/, config.yaml), .opencode/skills/openspec-*, and opencode.jsonc /opsx:* entries exist.
- S2: GIVEN config.yaml is customized, WHEN read, THEN it contains project context: TypeScript/JSON/YAML/Markdown, personal config repo, conventional commits, TDD-first, caveman style.
- S3: GIVEN both openspec-behavior-specs skill and generated openspec skills coexist, WHEN listing skills, THEN no name/description collision.

## Tasks

2.1. Verify/install: `openspec --version` (else npm i -g @fission-ai/openspec@latest).
2.2. cd /data/sites/ai/settings-opencode && openspec init --tools opencode.
2.3. openspec config profile → select EXPANDED.
2.4. openspec update.
2.5. Customize openspec/config.yaml with project context.
2.6. Confirm skills/openspec-behavior-specs/ intact, no conflicts with generated skills.
2.7. Verify artifacts: openspec/ dir, 6 generated skills, /opsx:* command entries.

## Risks

- MEDIUM: init may overwrite existing opencode.jsonc entries — review diff before accepting.
- LOW: behavior-specs vs generated openspec skill overlap (different concerns: RFC 2119 formatting vs spec workflow).
- Sources: web:https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/docs/getting-started.md, web:https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/docs/commands.md, web:https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/docs/workflows.md
