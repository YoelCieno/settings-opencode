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

## Source citations

Always cite `Source/s: <urls/docs>` at end of planning, research, discussion, or ask responses. Wants to know where info came from.

## Coding constraints (REMEMBER)

1. **Optional params at end** — never before required params. `fn(req, opt?)` not `fn(opt?, req)`.
2. **Max 3 params** — if more, use object param.
3. **Avoid casts** — use typed objects over `as Record<string, unknown>` + individual `as Type` casts. KISSME principle: if type is wrong, fix the type, don't cast around.
4. **Prefer function factories** over ternary chains for computed values — `resolvePrice(config, counter)` vs `sentinel ? 0 : ...` ternary.
5. **"Simplify without casting" = eliminate, not relocate.** Moving a type assertion into another file/module does NOT count as simplifying. When user asks to remove casts, actually remove them (use typed globals, guards, `satisfies`); only 1 unavoidable boundary cast is acceptable and must be documented.

## Git summaries

Always include the commit message in git summaries — user reviews commits from git graph and needs the message there.
