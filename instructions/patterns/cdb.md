# CDB (Compose Design Balance)

**Applies to:** `coder` subagent during implementation

CDB = SRP + MCMC + Open/Closed + First-Class Modules, balanced to avoid over-engineering.

---

## 1. SRP for Functions / Methods

### Real world example

Pocket knife that's also a screwdriver, bottle opener, and scissors is worse at every job than dedicated tools. Each function should be the right tool.

### In plain words

One function, one level of responsibility. If a function does "A and B", split it.

### How to apply

This is about **inner function extraction** — a function that does too much inline should delegate to helper fns, each at its own level of abstraction. Compare with §3 (First-Class Citizens) which is about passing functions as values.

```typescript
// ❌ Mixes three levels of abstraction in one function
function renderUserProfile(userId: string) {
  const user = db.users.find(userId);              // data access
  const posts = db.posts.findByUser(userId);       // data access
  const html = `<h1>${user.name}</h1>`             // presentation
    + posts.map(p => `<li>${p.title}</li>`);
  document.body.innerHTML = html;                  // DOM mutation
}

// ✅ One level per inner function
function renderUserProfile(userId: string) {
  const userData = fetchUserData(userId);
  const profileHtml = buildProfileHtml(userData);
  displayHtml(profileHtml);
}

function fetchUserData(userId: string) { /* DB work — one concern */ }
function buildProfileHtml(data: UserProfileData) { /* HTML — one concern */ }
function displayHtml(html: string) { /* DOM — one concern */ }
```

> **Coder note:** This is different from §3 below. SRP is about *extracting helper functions*. First-Class Citizens is about *passing functions as values* (callbacks, HOFs, strategies). Don't confuse them.

---

## 2. MCMC → Open/Closed (Maximize Cohesion, Minimize Coupling)

### Real world example

USB-C: high cohesion (power + data in one cable), minimal coupling (works with any USB-C device). Don't need a separate cable per peripheral.

### In plain words

- **Maximize Cohesion**: things that change together live together
- **Minimize Coupling**: depend on abstractions, not concretions
- **Open/Closed**: open for extension (new code), closed for modification (existing code untouched)

### How to apply

Functions-as-strategies achieve the same Open/Closed principle as classes. They use a flatter hierarchy VS an object-oriented hierarchy.

```typescript
// ❌ Tight coupling: function hardcodes a concrete dependency
function saveOrder(order: Order) {
  const db = new PostgresDatabase();  // concrete — can't swap
  return db.insert("orders", order);
}

// ✅ Minimal coupling: dependency injected as a function parameter
function saveOrder(order: Order, save: (table: string, data: Order) => Promise<void>) {
  return save("orders", order);
}

// ✅ Open for extension, closed for modification using function strategies
type ShippingCostFn = (weight: number, distance: number) => number;

function fedExShipping(weight: number, distance: number): number {
  return weight * 0.5 + distance * 0.1;
}

function upsShipping(weight: number, distance: number): number {
  return weight * 0.4 + distance * 0.15;
}

function calculateShipping(
  weight: number,
  distance: number,
  provider: ShippingCostFn   // function strategy — swap at call site
): number {
  return provider(weight, distance);
}

// New provider? Add a function. Don't touch calculateShipping.
```

---

## 3. Modules / Functions as First-Class Citizens

### Real world example

Toolbox: every tool is independent — grab the one you need. Not a "kitchen drawer" with a knife welded to a spoon.

### In plain words

Modules should be **nameable**, **passable**, **testable in isolation**, **replaceable**.

```typescript
// ❌ Namespace dump  →  ✅ Business concept modules
// file: email/index.ts
export { formatEmailAddress } from "./format";
export { validateEmail } from "./validate";
export { sendEmail } from "./send";

// ✅ Functions as first-class (composable)
const withLogging = <T>(fn: (input: T) => Promise<void>) =>
  async (input: T) => {
    console.log(`calling ${fn.name}`);
    return fn(input);
  };

const processOrder = withLogging(validateOrder);
```

> **Coder note:** Every non-trivial module you create should be replaceable without touching its callers. That means depending on abstractions, not concretions.

---

## When to use CDB

- Any module with 3+ functions sharing state or data
- System design — draw component boundaries
- Refactoring — extract until each function has one reason to change

## When not to use CDB

- Glue code, one-off scripts
- Over-engineering: not every 3-line function needs an interface
