# Framework‑Specific Wiring

Once the user answers which framework they are using, apply the corresponding patterns:

### React

- **Ports**: `Promise<T>` return type
- **API client**: `fetch`, `ofetch`, or `@tanstack/react-query`
- **State store**: implement `StorePort` with `useState`/`useReducer`, Zustand, or Redux Toolkit
- **Dependency Injection**: manual composition in `App.tsx`, or React Context for sharing instances
- **Apps folder**: `apps/{APP_NAME}/`

### Vue

- **Ports**: `Promise<T>` return type
- **API client**: `fetch`, `ofetch` (optionally wrapped in a composable)
- **State store**: implement `StorePort` with `reactive()` or Pinia
- **Dependency Injection**: `provide`/`inject` in `App.vue`
- **Apps folder**: `apps/{APP_NAME}/`

### Angular

- **Ports**: `abstract class` with `Observable<T>` return type
- **API client**: `HttpClient` (injected in endpoints)
- **State store**: signal‑based `BaseStore` implementing `StorePort`
- **Dependency Injection**: `@Injectable()` + `providers` array in route config
- **Apps folder**: `apps/{APP_NAME}/`

### Svelte / Solid / Others
abstract
- **Ports**: `Promise<T>` return type
- **API client**: native `fetch`
- **State store**: Svelte stores, Solid signals, or implement `StorePort` manually
- **Dependency Injection**: manual composition in root component
