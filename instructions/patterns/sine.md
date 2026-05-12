# SINE (Simple Is Not Easy)

**Applies to:** `coder` subagent during implementation

## Real world example

Microwave = simple (one job: heat food) but not easy for a first-time user (might put metal inside). Swiss Army knife = easy (familiar shape) but not simple (15 tools, hard to find corkscrew). Simple ≠ Easy.

## In plain words

- **Simple**: few concepts, low cognitive load
- **Easy**: familiar, requires no new learning
- They are **orthogonal**

Choose simple over easy when maintainability matters. Accept the upfront learning cost for long-term clarity.

## How to apply

```typescript
// ❌ "Easy" (familiar) — if-else chain grows with tiers
function getDiscount(user: User) {
  if (user.tier === "gold") return 0.2;
  else if (user.tier === "silver") return 0.1;
  else return 0;
}

// ✅ "Simple" (few concepts) — map lookup, one concept per tier
const discountByTier: Record<string, number> = {
  gold: 0.2,
  silver: 0.1,
};

function getDiscount(user: User) {
  return discountByTier[user.tier] ?? 0;
}
```

> **Coder note:** The `subagent-routing.md` first-tool gate seems unfamiliar to new contributors. That's fine — it's simpler than a flat rule list once learned.

## When to use

- API design, module boundaries, data models
- Differentiating "unfamiliar" from "wrong" in code review

## When not to use

- Prototypes where team velocity matters more than long-term structure
