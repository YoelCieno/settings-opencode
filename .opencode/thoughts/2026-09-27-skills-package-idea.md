---
description: 'Pencilled future idea: ship shared agent skills as an installable, forkable package instead of duplicating per repo.'
label: skills-package-idea
limit: 5000
read_only: false
---
## Future idea — skills-as-package (pencilled 2026-09-27)

Goal: shared opsx/openspec skills live in ONE installable package, not copied per repo (today duplicated: forma-initiale .opencode/ vs settings-opencode).

Shape:
- Own repo (candidate path: /data/sites/ai/settings-skills/), published as bun/npm package.
- Install into a *scanned* skill dir: ~/.config/opencode/skills/ or OPENCODE_CONFIG_DIR. WARNING: ~/.config/opencode/.opencode/skills/ is NOT scanned (proven: 12 replicated openspec skills never showed in <available_skills>).
- Per-user config: which skills enabled, custom paths.
- README carries a "Fork on GitHub" button -> user forks, customizes, installs their fork.

Not started. Owner: user. Trigger: when opsx dedupe (settings-opencode = single source of truth) gets painful across >1 repo.
