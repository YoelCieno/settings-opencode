# Comparison: code-memory (MCP) vs opencode-agent-memory (Plugin)

**Date:** 2026-05-26  
**Researched by:** conductor (direct, Task unavailable)  
**Topic:** Memory approaches for AI coding assistants

---

## Research Question

Compare fmflurry's [code-memory](https://github.com/fmflurry/code-memory) (MCP-based semantic + structural codebase memory) with [opencode-agent-memory](https://github.com/joshuadavidthomas/opencode-agent-memory) (OpenCode plugin for editable memory blocks). Determine which is the best fit for the current opencode setup, and whether they are complementary or competing.

---

## Key Finding (TL;DR)

**They are NOT competing. They solve different problems and are fully complementary.**

```
opencode-agent-memory = "Profile Memory"  → Who is the agent? Who is the user? What are the project conventions?
code-memory (MCP)       = "Codebase Memory" → What is in the code? Where is X defined? Who calls Y?
```

**Best answer: use BOTH.** fmflurry itself does exactly this — its `opencode.jsonc` lists `opencode-agent-memory` as a plugin AND registers `code-memory` as an external MCP server. The two layers have zero overlap.

---

## Options Considered

| # | Option | Type | Creator |
|---|--------|------|---------|
| A | **opencode-agent-memory** | OpenCode plugin (TypeScript, npm) | [joshuadavidthomas](https://github.com/joshuadavidthomas/opencode-agent-memory) |
| B | **code-memory** | MCP server (Python, external infra) | [fmflurry](https://github.com/fmflurry/code-memory) |
| C | **Both (A + B)** | Combined | N/A |

---

## Resource Analysis

### Option A: opencode-agent-memory

| Source | What it says |
|--------|-------------|
| **Official README** | Letta-style editable memory blocks for OpenCode. 3 tools: `memory_list`, `memory_set`, `memory_replace`. Blocks are markdown files + YAML frontmatter. Injected into system prompt. Default blocks: persona, human, project. |
| **Source code** (`src/tools.ts`) | 3 tools + 3 journal tools. Scope defaults: read=all, write=project (safer). Block format: `{label, description, limit, read_only}`. |
| **Docs/guides** | Letta shared memory blocks pattern. "Think of it as AGENTS.md with a harness." |
| **Current usage** | Already installed in `opencode.jsonc` line 475. Active memory blocks in `.opencode/memory/`: `architecture.md` (41 lines, 1845 chars), `project.md` (65 lines, 2465 chars). |

### Option B: code-memory (MCP)

| Source | What it says |
|--------|-------------|
| **Official README** | "A lightweight, local-first memory layer for coding agents." Three memory types: structural (FalkorDB graph), semantic (Qdrant vectors), episodic (SQLite). Retrieval via `codememory_retrieve` tool. Requires Docker + Python 3.11+ + Ollama. |
| **Benchmarks** | Recall@10 0.967 vs rg 0.367 (+164%). MRR +372%. p50 latency 86ms vs rg 176ms. Topology queries return 5-30× less context than rg. |
| **Architecture doc** | Two-phase: offline index everything/inject nothing, online retrieve small Context Pack. Bi-encoder (bge-m3) + optional cross-encoder rerank. Hybrid dense+sparse opt-in. |
| **Integration** | MCP server exposes tools. Snapshot publish/sync for team sharing (git-based distribution). Plugins for OpenCode + Claude Code. |

### Option C: Both

| Source | What it says |
|--------|-------------|
| fmflurry's `opencode.jsonc` | Lists `opencode-agent-memory` in plugins AND registers `code-memory` as external MCP. Both active simultaneously. |
| fmflurry's `instructions/codememory-first.md` | "For repo understanding, prefer CodeMemory before raw text tools." This is a separate instruction from the memory block system. |

---

## Conflicts Between Sources

| Conflict | Resolution |
|----------|-----------|
| None fundamental. The two systems operate at entirely different layers. | They serve different purposes: profile/project conventions vs codebase indexing. |
| code-memory requires Docker + Ollama + Python 3.11 — heavy infra | opencode-agent-memory is zero-infra (pure TS plugin). Both viable, different cost profiles. |
| code-memory README claims "self-editing memory" (agents can update the index) — but this is actually about the agent calling `codememory_reingest`, not about the agent modifying its own persona. | No conflict with opencode-agent-memory's self-editing blocks. Different type of "self-editing." |

---

## Comparison Table

| Dimension | opencode-agent-memory | code-memory (MCP) |
|-----------|----------------------|-------------------|
| **Type** | OpenCode plugin (TS, npm) | MCP server (Python, external) |
| **Infrastructure** | None (pure JS plugin) | Docker + FalkorDB + Qdrant + Ollama + Python 3.11+ |
| **Memory domain** | **Profile** (agent persona, user prefs, project conventions, architecture rules) | **Codebase** (symbols, imports, calls, semantic chunks, episodes) |
| **Storage** | `.opencode/memory/*.md` + `~/.config/opencode/memory/*.md` | FalkorDB (graph) + Qdrant (vectors) + SQLite (episodes) |
| **Tools** | `memory_list`, `memory_set`, `memory_replace`, `journal_write`, `journal_search`, `journal_read` | `codememory_retrieve`, `codememory_callers`, `codememory_definitions`, `codememory_importers`, `codememory_episodes`, `codememory_reingest` |
| **Context injection** | Full blocks injected into system prompt (always in-context) | Context Pack retrieved on-demand (only relevant chunks) |
| **Chars/tokens** | Limited by block `limit` field (default 5000 chars per block). Always in context. | Index can be GB-scale. Only ~few KB retrieved per query. |
| **Persistence** | Cross-session via markdown files | Cross-session via DBs. Also episodic + claim extraction. |
| **Semantic search** | Journal only (local all-MiniLM-L6-v2 embeddings) | Full vector search via Qdrant (bge-m3, 1024-d) |
| **Team sharing** | Git-commit `.opencode/memory/*.md` (but gitignored by default) | Snapshot publish/sync via git branch |
| **Setup time** | Seconds (npm install) | ~30 min (Docker + Ollama + Python) |
| **Disk usage** | ~0 MB (just markdown files) | ~3 GB base + ~5.4 GB if claims enabled |
| **Latency** | Instant (in-context) | ~86ms p50 for retrieve, ~0.5-0.8s for topology |
| **Privacy** | 100% local (markdown files) | 100% local (Docker, no external calls) |
| **Maintenance** | Zero (file-based) | Docker containers + DB compaction + periodic re-ingest |
| **Provider lock-in** | None (works with any OpenCode model) | None (local only) |
| **Maturity** | Stable, simple, well-documented | Active development (59 commits). MCP integration works. |
| **License** | MIT | MIT |

---

## Detailed Analysis

### What opencode-agent-memory is GOOD at

1. **Persistent agent identity.** "I am an AI assistant with these traits" — stored in persona block.
2. **User preferences.** "Fer prefers caveman mode, TDD, ask-before-commit" — stored in human block.
3. **Project conventions.** "Monorepo structure, PascalCase models, .spec.ts test files" — stored in project/architecture blocks.
4. **Always in-context.** Memory blocks are injected into the system prompt at every session start. No retrieval delay.
5. **Zero infrastructure.** Pure npm plugin. Works instantly.
6. **Self-editing.** The agent can read/modify its own memory blocks using dedicated tools.
7. **Lightweight journal.** Append-only entries for cross-session discoveries.

### What code-memory is GOOD at

1. **Codebase navigation.** "Where is the auth middleware?" "What calls UserService?" "Who imports this module?" — answered via graph + vector search.
2. **Semantic code search.** Find code by intent, not just keyword. "How is the resolver wired into ingest?" — returns ranked, relevant chunks.
3. **Structural queries.** Callers, definitions, importers — with typed edges (not lexical grep matches). Returns jump-ready JSON, not raw file lines.
4. **Episodic recall.** "We fixed this bug last month — what was the patch?" — retrieves past tasks from SQLite.
5. **Team-scale.** Snapshot publish/sync lets CI build the index once and distribute to all devs in seconds.
6. **Token efficiency.** Only retrieves relevant chunks (few KB) instead of dumping full files. 5-30× less context than grep-based alternatives.

### What each is BAD at

**opencode-agent-memory:**
- Cannot answer structural code questions (no graph DB)
- Cannot do semantic code search (only journal has embeddings)
- Limited to small, human-curated content (5K chars per block)
- No episodic recall of past sessions (journal has basic search but no code-aware retrieval)

**code-memory:**
- Cannot store agent persona or user preferences (wrong tool for that)
- Heavy infrastructure (Docker, Python, Ollama → ~3 GB disk)
- Not always in-context — requires retrieval call (one extra tool use)
- Doesn't inject into system prompt — agent must remember to call it
- Requires periodic re-ingest to stay current with code changes

---

## Which is the Best Fit?

### Current setup assessment

The current opencode config already has **opencode-agent-memory** installed (line 475 of `opencode.jsonc`). Memory blocks are populated and actively used:
- `persona` block: empty (0 chars of 5000 limit)
- `human` block: 811 chars — key preferences (TDD, git ask, caveman)
- `project` block: 2465 chars — Zed config lessons, git strategy
- `architecture` block: 1845 chars — TDD rule, coding conventions, monorepo structure

This is working well for its purpose. The `persona` block is empty and should be populated to improve agent consistency.

### Recommendation

**Adopt code-memory as a complement.** The two systems have zero overlap:

```
opencode-agent-memory:
  → "I am a TDD-first assistant working with Fer"
  → "This project uses hexagonal architecture with Vue"
  → "Remember to ask before committing"

code-memory:
  → "The auth middleware is at src/middleware/auth.ts, called by 7 routes"
  → "UserService.by() was refactored in episode #42 to use new repo pattern"
  → "The resolver is wired into ingest via the dependency graph: ..."
```

**Implementation plan:**

1. **Keep opencode-agent-memory** — it's already installed and working. Populate the empty `persona` block.
2. **Add code-memory MCP server** — register it as an external MCP in the OpenCode config. Requires Docker + Ollama + Python setup on the dev machine.
3. **Add `instructions/codememory-first.md`** — instruction that tells the agent to prefer `codememory_retrieve` before `grep`/`glob`/`read` for codebase exploration (like fmflurry does).
4. **Let code-memory handle** code navigation, semantic search, structural queries, episodic recall.
5. **Let opencode-agent-memory handle** persona, preferences, project conventions, architecture rules.

### Priority assessment

- **High value, low effort**: Populate `persona` block in opencode-agent-memory (0 → populated)
- **High value, medium effort**: Install code-memory for forma-initiale monorepo (currently 4 packages + 2 apps — will benefit from semantic code search)
- **High value, lower effort for code-memory**: Use snapshot publish/sync so CI builds index once

---

## Open Questions

1. **code-memory stability** — The repo has 59 commits, benchmarked on Angular + C#. Is it production-ready for daily use?
2. **Ollama model memory** — `bge-m3` is ~1.2 GB, plus optional `gemma2:9b` at ~5.4 GB. Acceptable on a dev machine with 16GB+ RAM?
3. **Re-ingest frequency** — For a fast-moving monorepo, how often should re-ingest run? Per-file hook (auto) vs periodic full re-ingest?
4. **Snapshot CI cost** — GitHub Actions runner would need NVIDIA GPU + TEI for fast ingest. Is that available?
5. **opencode-agent-memory journal vs code-memory episodic** — overlap? The opencode-agent-memory journal is semantic (local embeddings). code-memory episodic is SQLite + recall. Both capture cross-session knowledge but at different granularities. Could potentially consolidate.
6. **MCP permission model** — Does OpenCode's MCP allowlist support `code-memory_*` patterns? (fmflurry does `"code-memory_*": true` per subagent.)

---

## Decision

**Date:** 2026-05-26  
**Decision:** Keep current setup. **Do not install code-memory.**

### Reasons

1. **Serena overlap** — code-memory's core features (find symbol, find references, find implementations, search by pattern) are already covered by Serena's MCP tools. The only unique differentiators (intent-based semantic search, episodic recall) are nice-to-have, not critical.

2. **Infra cost vs value** — code-memory requires Docker + Ollama + Python 3.11+ + ~6.6GB RAM (bge-m3 1.2GB + optional gemma2:9b 5.4GB). This is a config repo, not a 100k+ file monorepo. The ROI isn't there.

3. **KISSME principle** — Adding code-memory violates Keep It Simple, Maintainable & Explicit. Two memory systems + Serena + codemaps is already sufficient for codebase navigation.

4. **Cross-session knowledge friction** — opencode-agent-memory journal and code-memory episodic recall overlap at different granularities. Would need consolidation — more complexity.

### What we already have

| Layer | Tool | Purpose |
|-------|------|---------|
| Profile memory | opencode-agent-memory (plugin) | Persona, human, project, architecture blocks |
| Code navigation | Serena (MCP) | Symbol lookup, references, implementations, pattern search |
| Structural overview | Codemaps (generated docs) | High-level architecture docs regenerated on code changes |

### Re-evaluation trigger

Revisit code-memory if:
- Working on a monorepo with 100k+ files where semantic search would materially save time
- Serena proves insufficient for codebase navigation in actual daily use
- Infra requirements drop (no Docker, smaller models)
