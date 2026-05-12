# KISSME (Keep It Simple, Maintainable Experience)

**Applies to:** `coder` subagent during implementation

## Real world example

Flat roof shed — simplest build. A year later rain pools, wood rots, you rebuild. The simpler-from-day-one shed adds a gentle slope. KISSME is simplicity as lifetime cost, not a snapshot.

## In plain words

Don't just be simple *now*. Stay simple across *every future change*. Every addition should make the system easier to reason about, not harder.

## How to apply

```typescript
// ❌ Short-term "simple" — grows forever
function handleUserAction(action: string, data: unknown) {
  if (action === "create") { /* 50 lines */ }
  else if (action === "update") { /* 50 lines */ }
  else if (action === "delete") { /* 50 lines */ }
}

// ✅ Maintainable — each path stays simple
const userCommands: Record<string, (data: unknown) => Promise<void>> = {
  create: (data) => userService.create(data),
  update: (data) => userService.update(data),
  delete: (data) => userService.delete(data),
};

function handleUserAction(action: string, data: unknown) {
  return userCommands[action]?.(data);
}
```

> **Coder note:** When adding a new routing rule in `subagent-routing.md`, ask: does this make routing simpler to reason about, or just differently complex? If the latter, refactor instead of append.

## When to use

- Every design decision
- Code review: "Is this the simplest version that *stays* simple?"
- Adding features to existing modules

## When not to use

- Disposable scripts or throwaway prototypes
