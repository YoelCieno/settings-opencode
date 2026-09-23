---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# Function Factory Pattern (JS/TS)

> CANONICAL source for this pattern. No other rule file defines or duplicates it. Applies ALWAYS — no exceptions, no per-file opt-out.

## Rule (ALWAYS)

Whenever coding a **hook**, **composable**, or **helper** module in JS/TS:

- **2+ functions per module** → factory-closure pattern (REQUIRED)
- **1 function per module** → direct export

## Factory template (2+ fns)

```ts
// outer: always `export function` declaration (never arrow)
export function object() {
  // inner: always arrows (closure captures)
  const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype

  const safeJsonParse = <T = unknown>(input: string, label: string): T => {
    try {
      // unavoidable boundary cast: JSON.parse returns any (1 documented cast max)
      return JSON.parse(input) as T
    } catch {
      throw new Error(`Invalid JSON in ${label}`)
    }
  }

  // return interface declared in SAME file
  return { isObject, safeJsonParse }
}
```

## Direct template (1 fn)

```ts
export const validateHex = (hex: string): boolean =>
  /^#[0-9a-fA-F]{6}$/.test(hex) || /^#[0-9a-fA-F]{3}$/.test(hex)
```

## Consumer usage

```ts
import { object } from '@repo/utils/object'
const { isObject, safeJsonParse } = object()

import { validateHex } from '@repo/utils/validate'
```

## Constraints

- Outer factory: `export function` declaration. Inner fns: arrows.
- Factory return-type interface lives in same file (e.g. `Case` in `string.ts`).
- Re-exporting from factory: import factory → destructure → re-export individual fns.
- Optional params last, max 3 params (else object param), no casts around types — fix the type.
- Single default exports (plugins, tools) stay direct — pattern targets helper/hook/composable modules.

## Scope

- Applies to new code immediately.
- Retroactive: refactor listed helpers only when file is touched for other work (no mass refactor).
