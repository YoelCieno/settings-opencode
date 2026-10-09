---
name: frontend-hexagonal-architecture
description: Hexagonal Architecture (Ports & Adapters) applied to any frontend project — regardless of framework or library. Provides a universal folder structure (domain / infra / apps) and adapts to Angular, React, Vue, Svelte, Solid, or any other UI technology. Asks about the target framework before generating concrete code.
compatibility: Node.js >= 18, any modern frontend framework / library
metadata:
  version: "1.0"
  category: architecture
  triggers:
    - hexagonal architecture
    - ports and adapters frontend
    - clean architecture frontend
    - domain / infra / apps structure
    - domain layer frontend
---

# Frontend Hexagonal Architecture (Framework‑Agnostic)

## Activation Questions

Before writing any code, ask the user **in order**:

1. **What is the app name?**  
   > (e.g., `react-ui`, `vue-ui`, `angular-ui`, `svelte-dashboard`, etc.)

2. **Which UI framework / library are you using?**  
   > (Angular, React, Vue, Svelte, Solid, plain TypeScript, etc.)

Only after both are confirmed, consult the **Framework‑Specific Wiring** section and generate code with the correct patterns, using `apps/{APP_NAME}/` as the folder name.

---

## Architecture at a Glance

Hexagonal Architecture — also called **Ports & Adapters** — separates pure business logic from all external concerns. The same principles apply equally to any frontend technology.

### Three Layers

| Layer | Folder | Contains | Depends on |
|-------|--------|----------|------------|
| **Domain** | `domain/` | Models, ports (abstract contracts), pure business rules | Nothing external |
| **Infrastructure** | `infra/` | Adapters, HTTP clients, repositories, store implementations | Only `domain/` |
| **Apps** | `apps/` | One sub‑folder per app (e.g., `{APP_NAME}`) | `domain/` and `infra/` |

### Folder Structure

```
src/
├── domain/
│   ├── models/               # Plain TypeScript types / interfaces
│   ├── ports/                # interfaces  or abstract classes (contracts)
│   └── rules/                # Pure validation functions & constants (only when needed)
├── infra/
│   ├── adapters/             # Port implementations
│   ├── repositories/         # Data-access implementations
│   ├── http/                 # HTTP client wrappers (fetch, oftech, etc.)
│   ├── store/                # State-management adapters (implements StorePort)
│   ├── dto/                  # Data Transfer Objects (API response/request shapes)
│   └── mocks/                # Mock data providers
└── apps/                     # (or infra/apps/ — both approaches are valid)
    ├── {APP_NAME}/          # (or inside `infra/apps/`)  # e.g., react-ui, vue-ui, angular-ui, svelte-dashboard
```

### Dependency Direction (CRITICAL)

```
apps  ──→  domain  ←──  infra
            (Zero external dependencies)

- Domain NEVER imports from infra or apps.
- Infra implements what domain defines.
- Apps wire everything together and render the UI.
```

This is the essence of the **Dependency Inversion Principle**: the inner circle (`domain`) owns the contracts; the outer circles (`infra`, `apps`) implement them.

---

## Layer Templates

### 1. Domain — Models

```typescript
// domain/models/Product.ts
export interface Product {
  id: string
  title: string
  price: number
}
```

**Rules**: use `type`, never `any` (use `unknown` if truly unknown), optional `?:` props, group by entity.

### 2. Domain — Ports (Abstract Contracts)

```typescript
// domain/ports/get-products.port.ts
export interface GetProductsPort {
  execute(filters?: ProductFilters): Promise<Product[]>;
}
```

**Rules**: use `interface`, one operation per port (Interface Segregation), zero framework imports, suffix `Port`.

> For frameworks using RxJS (e.g., Angular), return `Observable<T>` instead of `Promise<T>`. For others, `Promise<T>` is the standard.

### 3. Domain — Business Rules (Only When Needed)

```typescript
// domain/rules/cart.rules.ts
export const MAX_CART_ITEMS = 5;
export const MAX_CART_PRICE = 100;

export function canAddToCart(cart: Cart, product: Product): boolean {
  if (cart.products.length >= MAX_CART_ITEMS) return false;
  if (cart.products.find((p) => p.id === product.id)) return false;
  const totalPrice = [...cart.products, product].reduce((s, p) => s + p.price, 0);
  return totalPrice <= MAX_CART_PRICE;
}
```

**Rules**: pure functions, `as const` constants, zero dependencies.

### 4. Infrastructure — Adapters

```typescript
// infra/adapters/get-products.ts
import { GetProductsPort } from '../../domain/ports/get-products.port';
import { HttpClient } from '../http/http-client';

export class GetProductsAdapter implements GetProductsPort {
  constructor(private readonly http: HttpClient) {}

  async execute(filters?: ProductFilters): Promise<Product[]> {
    const response = await this.http.get<ProductDTO[]>('/products', { params: filters });
    return response.map((dto) => ({ id: dto.id, title: dto.title, price: dto.price }));
  }
}
```

**Rules**: `implements` port, inject HTTP client, transform DTOs → domain models.

### 5. Infrastructure — State Management (StorePort)

To keep state management framework‑agnostic, define an abstract contract:

```typescript
// domain/ports/store.port.ts
export interface StorePort<T> {
  getState(): T;
  setState(partial: Partial<T>): void;
  subscribe(listener: (state: T) => void): () => void;  // returns unsubscribe function
}
```

The concrete implementation goes in `infra/store/`:

```typescript
// infra/store/memory.store.ts
// For React: implement with useState / useReducer / Zustand
// For Vue: implement with reactive() / Pinia
// For Angular: implement with Signal / BehaviorSubject (see Ang. section) 
// For Svelte 5 (primary): use classes with $state, $derived, $effect runes
// For Svelte (legacy): use writable / readable / derived from svelte/store
```

### 6. Apps — Framework‑Specific Entry Points

Inside `apps/`, each sub‑folder is a complete application that depends on the same `domain/` and `infra/` layers:

```
apps/
├── {APP_NAME}/       # e.g., react-ui/, vue-ui/, angular-ui/, svelte-dashboard/
│   └── src/
│       ├── App.tsx   # or App.vue for Vue, app.component.ts for Angular
│       └── components/
```
---

## Minimal Start (KISSME Philosophy)

Adopt a **progressive** approach: begin with the fewest files that still respect the dependency direction. Add new layers (ports, adapters, use cases, store, context‑registry) only when the existing structure genuinely needs them.

### Phase 0 – The Absolute Minimum

This is the smallest running hexagonal frontend.  
It has just one external call (e.g., fetch a list) and one UI component.

```
src/
├── domain/
│   └── models/
│       └── product.ts          # Plain type definition
├── infra/
│   └── adapters/
│       └── get-products.adapter.ts  # Direct fetch, implements contract inline
└── apps/
    └── <APP_NAME>/         # e.g., vue-ui/
        └── ProductsPage.vue    # One component, consumes adapter directly
```

**Key point**: at this stage there is **no port** – the component receives the adapter instance directly (or via a simple DI function). The adapter still lives in `infra/`, so the `domain/` remains untouched by framework code.

#### When to add a Port

As soon as **more than one adapter** could exist (e.g., a mock for tests, a real HTTP adapter), extract an abstract contract:

```
domain/
└── ports/
    └── get-products.port.ts    # abstract interface class or abstract base class
```

Now both adapters implement the port, and the component depends on the port (injected).

### Phase 1 – Ports and Use Cases

Once business rules appear (e.g., filter out products that are out of stock), add a use case so the logic stays in `domain/`:

```
src/
├── domain/
│   ├── models/
│   ├── ports/
│   └── rules/                  # optional pure functions
│   └── use-cases/
│       └── list-available-products.use-case.ts
├── infra/
│   └── adapters/
└── apps/
```

Components now use the **use case**, not the port directly.

### Phase 2 – State Management

Add a store **only when** the UI needs to share state across multiple components.

- Define a `StorePort` in `domain/ports/`
- Implement it in `infra/store/` using your chosen framework library
- Inject the store into the use case (or into a facade if you choose to use one)

### Phase 3 – Context Registry

Needed only when **multiple domains** must communicate (e.g., Orders needs Customer data).  
Define a `ContextRegistry` in `infra/context/` (or `shared/`) and map each domain’s required providers.

### KISSME Summary Table

| Project State | Files You Need |
|---------------|----------------|
| Just started, one data fetch | `domain/models`, `infra/adapters`, `apps/<framework-ui>/[page]` |
| Need tests / multiple implementations | add `domain/ports` |
| Business logic appears | add `domain/use-cases` |
| State shared across components | add `domain/ports/store.port` + `infra/store` |
| Two or more domains interact | add `infra/context/` |

This progressive model respects **hexagonal boundaries** while keeping the codebase lean and maintainable. Never add a layer until its benefit is clear.

---

## Framework‑Specific Wiring

See [framework-wiring.md](./framework-wiring.md) for framework-specific implementation details.

---

## Implementation Playbook

See [implementation-playbook-agnostic.md](./implementation-playbook-agnostic.md) for framework-agnostic steps and [implementation-playbook-specific.md](./implementation-playbook-specific.md) for framework-specific examples.

---

## Checklist

- [ ] Domain layer (`domain/`) has **zero** framework or infrastructure imports
- [ ] Ports are abstract and technology‑agnostic
- [ ] Adapters implement ports (never the reverse)
- [ ] UI components (`apps/`) only reference `domain/` and `infra/` — never the opposite
- [ ] No `any` type used; `unknown` allowed when absolutely necessary
- [ ] Immutable state updates (spread operator, no mutation)
- [ ] Business rules are pure functions with no side effects
- [ ] Framework‑specific code is isolated in `apps/<APP_NAME>/`

---

## References

- https://feature-sliced.design/vi/blog/frontend-clean-architecture
- https://codeartify.substack.com/p/ditching-the-dogma-for-pragmatism
- https://blog.octo.com/hexagonal-architecture-three-principles-and-an-implementation-example
- https://softengbook.org/

## Autoskills.sh Integration

For deterministic skill generation, consider using [autoskills.sh](https://www.autoskills.sh) to create framework-specific variations of this skill. The hexagonal architecture principles can be applied to generate targeted skills for specific use cases while maintaining framework-agnostic core concepts.

---

## Testing patterns

See [testing-patterns.md](./testing-patterns.md) for testing guidance.
