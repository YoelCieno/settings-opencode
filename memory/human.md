---
description: Key details about the human I'm working with
label: human
limit: 5000
read_only: false
---
## Workflow principle

Always check the official schema/model docs before implementing any interface, configuration, or data format (JSON, JSONC, YAML, TOML, etc.). Never assume field names or formats based on similarity to other tools. Verify against the actual spec first.

## TDD rule (NON-NEGOTIABLE)

Every feature, refactor, or fix starts with tests. RED → GREEN → REFACTOR. Minimum 80% coverage. No implementation code without failing tests first. This applies to composables, adapters, components, models — everything.

## Git rule

Always ask before committing and pushing. Never auto-commit even for trivial changes. User must confirm explicitly.

## Communication style

Prefers condensed, factual responses. Cuts fluff. Responds in caveman mode unless security/irreversible/warnings require clarity.

## Git summaries

Always include the commit message in git summaries — user reviews commits from git graph and needs the message there.
