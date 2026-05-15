# Development Patterns

Design principles for writing maintainable, predictable, composable code. Heavily inspired by [Design Patterns for Humans](https://github.com/nilbuild/design-patterns-for-humans) and [JavaScript Design Patterns for Humans](https://github.com/sohamkamani/javascript-design-patterns-for-humans).

---

These patterns apply primarily to **implementation work** — they are **binding instructions** for the `coder` subagent. Each pattern file includes when-to-use / when-not-to-use guidance.

## The Patterns

| # | Pattern | Core Idea | File |
|---|---------|-----------|------|
| 1 | **KISSME** | Keep It Simple, Stupid: Maintainable Experience — simplicity as a lifetime property | [`patterns/kissme.md`](./patterns/kissme.md) |
| 2 | **SINE** | Simple Is Not Easy — choose simple over familiar | [`patterns/sine.md`](./patterns/sine.md) |
| 3 | **POLA** | Principle Of Least Astonishment — don't surprise the caller | [`patterns/pola.md`](./patterns/pola.md) |
| 4 | **SoC + CQS** | Separate Concerns + Commands vs Queries — mutators and readers never mix | [`patterns/soc-cqs.md`](./patterns/soc-cqs.md) |
| 5 | **CBD** | Compose Balanced Design — SRP + MCMC/OpenClosed + First-Class Modules | [`patterns/cbd.md`](./patterns/cbd.md) |

## Relationship with Other Files

- `subagent-routing.md` delegates implementation to `coder` — these patterns define *how* `coder` should implement
- `skills/coding-standards/SKILL.md` complements these patterns with language-level conventions (naming, formatting, types)
