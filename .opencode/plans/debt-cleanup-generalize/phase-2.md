# Phase 2 — Generalized instincts.json

**Status:** ✅ DONE
**Last updated:** 2026-06-01

## Goal

Create generic instinct triggers at `/skills/debt-cleanup/instincts.json` without forma-initiale-specific references.

## Tasks

- [x] Create instincts.json with generic trigger patterns
- [x] Replace WA-specific triggers with generic equivalents
- [x] Add trigger: "renamed or deleted file" → check for stale references
- [x] Add trigger: "new package or dependency added" → check config drift
- [x] Add trigger: "added env variable" → check .env.example sync
- [x] Add trigger: "before declaring done" → run verification gate

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Keep instinct pattern structure? | Yes | 0.8-0.95 confidence scoring works well |
