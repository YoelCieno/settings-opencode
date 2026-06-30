---
description: Review code, PRs, docs, or DB schemas — /review [target] [--docs|--db] [--level] [--no-tools]
agent: reviewer
subtask: true
---

# Review Command

Review code changes, pre-merge PRs, documentation quality, or database schemas.

## Usage

```
/review                    Review current working tree changes
/review <target-branch>    Pre-merge review against target branch
/review --docs             Review documentation quality (delegates to /update-docs)
/review --db               Review database schemas and SQL (delegates to database-reviewer)
/review --db --migrations  Review recent migration files
```

## Flags

- `--level=junior|senior` — Verbosity (default: senior)
- `--scope=arch,ts` — Limit review checklists (default: all)
- `--no-tools` — Skip tsc + lint in pre-merge mode
- `--db` / `--database` — Review database schemas, queries, and migrations. Delegates to `database-reviewer` via Task.

## What You Do

1. Parse `$ARGUMENTS`:
   - First token = target branch (optional)
   - `--docs` flag → stop, redirect to /update-docs
   - `--db` or `--database` flag → delegate to database-reviewer agent via Task with remaining args
2. If target branch provided: run pre-merge review pipeline (diff, static review, tsc, lint, verdict).
3. If no target: run code review on current working tree changes (git diff, staged changes, recent commits).
4. Load `AGENTS.md` from repo root if it exists — project rules override defaults.
5. Emit structured report with severity table, findings, and verdict.

## Project-Specific Guidelines

When AGENTS.md exists:
- File size limits (200-400 lines typical, 800 max)
- Emoji policy
- Immutability requirements
- Error handling patterns
- State management conventions

Adapt review to project patterns. When in doubt, match codebase.

## Database Review

### Schema Design

- [ ] Data types appropriate (bigint vs int, text vs varchar(N), timestamptz vs timestamp, numeric vs float)
- [ ] Primary key strategy fits deployment (IDENTITY for single-DB, UUIDv7 for distributed)
- [ ] Foreign keys indexed on referencing side
- [ ] Composite indexes in correct column order (equality cols first, then range)
- [ ] Index type matches usage (B-tree default, GIN for JSONB/arrays, BRIN for time-series)
- [ ] NOT NULL constraints on required columns
- [ ] Default values set where sensible
- [ ] CHECK constraints for domain invariants
- [ ] Lowercase identifiers used consistently

### Query Quality

- [ ] All WHERE/JOIN/ORDER BY columns indexed
- [ ] No N+1 query patterns — use JOINs or batch with `= ANY(ARRAY[...])`
- [ ] EXPLAIN ANALYZE run on complex queries
- [ ] No full table scans on large tables
- [ ] Cursor-based pagination instead of OFFSET for deep pages
- [ ] Subqueries vs JOINs — pick the efficient form for the planner
- [ ] No implicit type coercion in WHERE clauses
- [ ] `SKIP LOCKED` used for worker queue patterns
- [ ] Transactions kept short — no external calls inside transactions
- [ ] Connection pooling configured, no idle-in-transaction

### Migration Safety

- [ ] Migration is reversible (has down migration or rollback plan)
- [ ] No locking DDL on production tables during peak hours (e.g., `ADD COLUMN DEFAULT` on large tables — use CHECK + backfill)
- [ ] Index creation uses `CONCURRENTLY` on live tables
- [ ] NOT VALID + VALIDATE pattern for foreign key constraints on large tables
- [ ] Data backfill done in batches, not single UPDATE
- [ ] Column drops happen after confirming no code references remain
- [ ] Migration tested against production-size dataset
- [ ] No sensitive data in migration comments or SQL

### Report Format

```
### Schema Issues
[Problems with data types, indexes, constraints]

### Query Performance
[Slow queries, missing indexes, N+1 patterns]

### Migration Risks
[Locking concerns, irreversibility, data loss potential]

### Recommendations
[Improvements to consider, ordered by impact]
```

---

**Note**: DB review delegates to `database-reviewer` subagent. The review agent does NOT perform DB review directly — it routes via Task with the arguments.

$ARGUMENTS
