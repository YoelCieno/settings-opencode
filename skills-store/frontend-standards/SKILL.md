---
name: frontend-standards
description: Frontend development patterns for component architecture, state management, performance optimization, and file organization. Covers React, Vue, Angular, and other UI frameworks.
---

# Frontend Standards

Additional frontend-specific conventions that supplement the general `coding-standards` skill. Covers component design, performance optimization, state management, file organization, and framework-specific practices.

## When to Activate

- Building or refactoring UI components
- Optimizing frontend rendering performance (memoization, lazy loading, virtualization)
- Organizing file structure in a frontend project
- Designing component architecture (composition, state management)
- Implementing code splitting or lazy loading

## Relationship with Other Skills

- `coding-standards` — language-level conventions (naming, types, error handling)
- `frontend-design` — visual/UI design, styling, layout
- `frontend-accessibility` — a11y patterns and audits
- `frontend-hexagonal-architecture` — ports & adapters frontend architecture

---

## File Organization

Conventions vary by framework. Choose one per project and stay consistent.

```
// React
components/Button.tsx          # PascalCase for components
hooks/useAuth.ts              # camelCase with 'use' prefix for hooks
lib/formatDate.ts             # camelCase for utilities
types/user.types.ts           # camelCase with .types suffix

// Vue
components/BaseButton.vue     # PascalCase, multi-word names preferred
composables/useAuth.ts        # camelCase with 'use' prefix for composables
stores/auth.ts                # camelCase for state stores
views/                        # Route-level page components

// Angular
components/button.component.ts  # kebab-case with .component suffix
services/auth.service.ts        # kebab-case with .service suffix
pipes/format-date.pipe.ts       # kebab-case with .pipe suffix
```

---

## Component Architecture

### Composition over Inheritance

```typescript
// ✅ GOOD: Compose small, focused components
function UserProfile({ user, avatar, bio }: Props) {
  return (
    <div className="profile">
      <UserAvatar image={avatar} />
      <UserName name={user.name} />
      <UserBio text={bio} />
    </div>
  );
}

// ❌ BAD: Monolithic component
function UserProfile({ user }: Props) {
  return <div className="profile">
    {/* 100+ lines mixing avatar, name, bio markup */ }
  </div>;
}
```

### Component Categories

| Type | Responsibility | Side Effects? | Data Source |
|---|---|---|---|
| **Presentational** | Pure rendering | No | Props only |
| **Container** | State & logic | Yes | State, effects, stores |
| **Page/Route** | Top-level composition | Yes | Route params, stores |

---

## State Management

### Choose by complexity

| Complexity | Pattern | Examples |
|---|---|---|
| Low (local) | useState / ref / signal | Component-only state |
| Medium (shared) | Context / provide-inject / lifted props | Theme, auth, i18n |
| High (global) | Dedicated store | Zustand, Pinia, NgRx, Redux Toolkit |

### Rule: State should live as close as possible to where it's used
- Local state first → lift only when siblings need it → global only when unrelated branches need it

---

## Performance Patterns

### Memoization

```typescript
// React: useMemo for expensive computations, useCallback for stable callbacks
import { useMemo, useCallback } from "react";

function ExpensiveList({ items, onSelect }: Props) {
  const sortedItems = useMemo(() =>
    [...items].sort((a, b) => b.score - a.score),
    [items]
  );

  const handleSelect = useCallback((id: string) => onSelect(id), [onSelect]);

  return <List items={sortedItems} onSelect={handleSelect} />;
}
```

### Lazy Loading & Code Splitting

```typescript
// React: Dynamic imports with Suspense boundary
import { lazy, Suspense } from "react";

const HeavyChart = lazy(() => import("./HeavyChart"));

export function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyChart />
    </Suspense>
  );
}
```

### Virtualization

- Use virtual scrolling for lists > 500 items
- Libraries: react-window, vue-virtual-scroller, @angular/cdk/scrolling
- Only render visible items — avoid 1000+ DOM nodes

### Debounce Frequent Events

```typescript
// Framework-agnostic: debounce rapid user input
function SearchInput() {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return <input onChange={(e) => setQuery(e.target.value)} />;
}
```

---

## Styling Patterns

| Pattern | Description | Frameworks |
|---|---|---|
| **CSS Modules** | Scoped class names, no conflicts | React, Next.js, Vite |
| **Scoped Styles** | Component-scoped CSS | Vue SFC (`<style scoped>`) |
| **View Encapsulation** | Emulated Shadow DOM | Angular |
| **Utility-First** | Composable atomic classes | Tailwind (all frameworks) |

- Use consistent design tokens (spacing, colors, typography)
- Prefer CSS variables for theming over JS-injected styles

---

## Event & Form Handling

### Controlled vs Uncontrolled

```typescript
// ✅ GOOD: Controlled input (single source of truth)
function Form() {
  const [email, setEmail] = useState("");
  return <input value={email} onChange={(e) => setEmail(e.target.value)} />;
}

// ✅ OK: Uncontrolled with ref (for non-validated, one-time reads)
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);
  return <input ref={inputRef} />;
}
```

### Form Validation

- Validate on submit (always)
- Validate on blur (enhancement)
- Validate on change (only if UX demands it — avoid aggressive validation)
- Use schema validation libraries like Zod, Yup
