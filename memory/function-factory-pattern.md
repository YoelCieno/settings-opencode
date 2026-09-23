---
description: >-
  ALWAYS-apply factory-closure convention for JS/TS hook, composable, and helper modules (ported from forma-initiale).
  Full spec: .rules/js/function-factory-pattern.md
label: fucntion-factory-pattern
limit: 5000
read_only: false
---

## Function factory pattern (ALWAYS for hooks/composables/helpers)

- 2+ fns/module → factory: `export function name() { const fns…; return {fns} }` — outer = function decl, inner = arrows
- 1 fn/module → direct export
- Consumer: `const { a, b } = name()`
- Return-type interface in same file; optional params last; ≤3 params; no casts (1 documented boundary cast max)
- Single default exports (plugins/tools) stay direct
- Canonical spec: `.rules/js/function-factory-pattern.md`
- Retroactive: refactor listed helpers only when touched — no mass refactor
