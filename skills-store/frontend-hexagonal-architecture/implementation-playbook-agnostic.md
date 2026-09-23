## Implementation Playbook (Framework‑Agnostic)

Follow these steps **in order** for any new domain:

| Step | Action | File(s) |
|------|--------|---------|
| 1 | Define domain models | `domain/models/<entity>.ts` |
| 2 | Define ports (abstract contracts) | `domain/ports/<verb-noun>.port.ts` |
| 3 | Add business rules | `domain/rules/<entity>.rules.ts` (if needed) |
| 4 | Implement adapter | `infra/adapters/<verb-noun>.adapter.ts` |
| 5 | Create HTTP client wrapper | `infra/http/<service>.http.ts` |
| 6 | Define DTOs | `infra/dto/<entity>.dto.ts` |
| 7 | Register infrastructure bindings | framework‑specific composition root |
| 8 | Build UI components | `apps/<framework-ui>/components/` |