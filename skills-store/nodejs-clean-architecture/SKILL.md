---
name: nodejs-clean-architecture
description: Scaffolds + extends Node.js/Fastify modules via Clean Architecture (core/infrastructure), Hexagonal ports/adapters, Prisma ORM. Use when creating new Node modules, adding routes/use-cases with infra integration, refactoring to ports/adapters.
---

# Node.js Clean Architecture + Fastify

## When To Activate

- Scaffolding new Node.js REST API with Clean Architecture
- Adding feature/module to existing Node.js project
- Adding route/use-case with infra integration (DB, HTTP, queue)
- Refactoring code toward ports/adapters and module isolation

## Stack

| Concern | Tool | Purpose |
|---------|------|---------|
| Framework | Fastify 5 | HTTP server, plugins |
| ORM | Prisma 7 + PostgreSQL | Type-safe DB access |
| Validation | Zod 4 | Runtime type checking |
| Testing | Vitest 4 | Unit + integration tests |
| Linting | Biome 2 | Format + lint |
| Logging | Pino | Structured logging |
| DI | Factory fns | `makeDependencies()` pattern |
| Node | ≥ 24 | ESM, native TS support |

## Architecture Overview

```
src/
├── core/                           # Domain hexagon (zero infra deps)
│   ├── entities/                   # TS interfaces (models)
│   │   └── user.ts                # e.g., User, UserPayload
│   ├── repositories/               # Outgoing ports (TS interfaces)
│   │   └── user.repo.ts           # IUserRepository
│   └── services/                   # Use cases (factory fns)
│       └── user.svc.ts            # userService(repo) → methods
│
├── infrastructure/                  # Driven side (DB, external APIs)
│   ├── database/                   # Prisma schema + client
│   │   └── schema.prisma
│   ├── repositories/               # Port implementations
│   │   └── user.repo.ts           # UserRepository implements IUserRepository
│   └── http/                       # HTTP layer
│       ├── controllers/             # Request handlers (use cases + Zod)
│       ├── routes/                  # Fastify RouteOptions arrays
│       ├── schemas/                 # Zod validation schemas
│       ├── plugins/                 # Fastify plugins (cors, helmet, rate-limit)
│       └── server/                  # Fastify instance + DI wiring
│
└── main.ts                         # Entry point

tests/
├── unit/                           # Narrow tests (mock repos, Vitest)
│   └── user.svc.test.ts
└── integration/                    # Wide tests (fastify.inject, Vitest)
    └── user.routes.int.test.ts
```

## Dependency Rules (CRITICAL)

```
Route → Controller → Service (use case) → [Outgoing Port] ← Repository Impl → DB
                  ↑ Core (domain)                            ↑ Infrastructure
```

- **Core has ZERO infrastructure dependencies** — only defines ports (interfaces) and pure business logic.
- **Infrastructure depends on Core only** — implements outgoing ports using Prisma/HTTP/external SDKs.
- **Controllers NEVER call repos directly** — always through services (use cases).
- **Cross-module calls via ports** — expose as interface and implement adapter.

## Hard Rules

- **Never** use `any` — use `unknown` if type truly unknown
- **Never** put business logic in controllers — use services
- **Never** call infrastructure directly from core — always through ports
- **Validate at boundaries** — Zod schemas in controllers
- **Core has ZERO infra deps** — no Fastify, Prisma, or DB imports
- Use ESM (`import/export`), not CommonJS (`require`)
- Use `vitest` for tests, not Jest

## Implementation Playbook

Follow these steps **in order**. **For full templates**: See [implementation-playbook.md](implementation-playbook.md).

1. Create or pick target module in `core/`
2. Define entities in `core/entities/` (TS interfaces)
3. Define outgoing port in `core/repositories/` (TS interface)
4. Implement use case in `core/services/` (factory fn)
5. Implement repository in `infrastructure/repositories/` (implements port)
6. Create Prisma schema in `infrastructure/database/schema.prisma`
7. Create Zod schema in `infrastructure/http/schemas/`
8. Create controller in `infrastructure/http/controllers/`
9. Create routes in `infrastructure/http/routes/`
10. Wire dependencies in `infrastructure/http/server/` via `makeDependencies()`
11. Write tests (see [testing-patterns.md](testing-patterns.md))

## Testing

**For full testing patterns**: See [testing-patterns.md](testing-patterns.md).

| Test Type | Scope | Approach |
|-----------|-------|----------|
| Unit | Use case logic | Mock repos with `vi.mock()` |
| Integration | Full HTTP pipeline | `fastify.inject()` + Vitest |

Target **80%+ coverage**.

## Naming Conventions

| Artifact | Pattern | Example |
|----------|---------|---------|
| Entity interface | PascalCase | `User`, `UserPayload` |
| Repository interface | `I` prefix + PascalCase | `IUserRepository` |
| Use case factory | camelCase + `.svc.ts` | `user.svc.ts` → `userService()` |
| Repository impl | PascalCase + `.repo.ts` | `UserRepository` |
| Controller | camelCase + `.ctrl.ts` | `user.ctrl.ts` → `createUser()` |
| Route | camelCase + `.routes.ts` | `user.routes.ts` |
| Schema | camelCase + `.schemas.ts` | `user.schemas.ts` |
| Prisma schema | `schema.prisma` | Prisma models |
| Server plugin | camelCase + `.plugin.ts` | `config.plugin.ts` |
| Test file | `*.test.ts` | `user.svc.test.ts` |
| Integration test | `*.int.test.ts` | `user.routes.int.test.ts` |

## Checklist: Adding a New Feature

- [ ] Entities defined as TS interfaces (not classes)
- [ ] Repository interfaces defined in `core/repositories/`
- [ ] Use cases are factory functions taking repo as param
- [ ] Repositories implement interfaces in `infrastructure/repositories/`
- [ ] Controllers use Zod for validation
- [ ] Routes use Fastify `RouteOptions` array pattern
- [ ] Server wired with `makeDependencies()` factory
- [ ] No `any` type used anywhere
- [ ] No business logic in controllers
- [ ] Core has zero infra dependencies
- [ ] Tests written (80%+ coverage)
- [ ] Unit tests mock repositories
- [ ] Integration tests use `fastify.inject()`

## Known Tradeoffs

- Module isolation is by **convention** (folders) unless split into separate packages
- Prisma schema lives in infrastructure, entities in core — map between them in repos
- One interface per repository keeps boundaries focused (ISP)
- `fastify.inject()` for integration tests avoids real network overhead
