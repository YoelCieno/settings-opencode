# Self-Improving OpenCode Settings: a command/skill to customize commands, instructions, memory, config

- **Date:** 2026-08-27
- **Mode:** Deep Dive
- **Question:** How to build a command/skill that improves OpenCode's own settings artifacts — commands, instructions, memory, and config (`opencode.json`/`opencode.jsonc`) — to produce a setup customized to the user.

---

## 1. Motivation

The repo `/data/sites/ai/settings-opencode` is a personal OpenCode/Zed/Claude dotfiles repo. It already has partial "self-improvement" machinery (`/learn`, `continuous-learning`, `customize-opencode` builtin, `opencode-skill-creator`, `skill-from-history`) but they overlap and none is a single, intentional entry point for "customize my setup." The user wants one command/skill that can target any of the four artifact classes and produce a tailored result.

This doc maps the real OpenCode schema, the existing machinery, the hard constraints imposed by *this repo's* agent config, and a concrete recommended design.

---

## 2. Core concepts

### 2.1 The four artifact classes and how OpenCode loads them

| Artifact | Storage | Loaded how | Edit mechanism |
|---|---|---|---|
| **Config** | `opencode.json` / `opencode.jsonc` at project root or `~/.config/opencode/` | Parsed at startup; `$schema: https://opencode.ai/config.json` | File edit (coder/writer) |
| **Commands** | `commands/<name>.md` (per-project `.opencode/commands/` or global `~/.config/opencode/commands/`) OR `command` key in JSON with `template` | Discovered at startup; `--agent/--model/--subtask` frontmatter | File edit or JSON edit |
| **Instructions** | Standalone `.md` files referenced by `instructions: [...]` array (supports globs + URLs) | Injected into system prompt | File edit |
| **Memory** | File-backed markdown: `memory/*.md` (global scope) + `.opencode/memory/*.md` (project scope), each with YAML frontmatter (`label`, `description`, `scope`, `limit`, `read_only`) | Loaded as memory blocks at startup | `memory_set` / `memory_replace` tools (write the `.md` files) |

Key schema facts (from `opencode.ai/config.json`):
- `instructions` accepts an **array of paths/globs** and even `https://` URLs. This repo uses file refs with env interpolation: `"instructions": ["{env:OPENCODE_SRC_ROUTE}/opencode/instructions/subagent-routing.md", ...]`.
- Two interpolation forms everywhere in config: **`{env:VAR}`** and **`{file:path}`** (path relative to config dir or `~`/absolute). Example from docs: `"apiKey": "{file:~/.secrets/openai-key}"`.
- Commands: markdown body = template; support **`$ARGUMENTS`** (full arg string) and **`$1` `$2`** positional. Optional frontmatter: `description`, `agent`, `model`, `subtask` (note: `subtask` is accepted but a **no-op in V2** — commands run in the current session, not a child session).
- Commands can also be registered purely in JSON under `command: { name: { template, description, agent, model } }`. This repo uses the markdown-file + `template: "{file:commands/X.md}\n\n$ARGUMENTS"` pattern (see `opencode.jsonc` lines 313–426).
- Agents: `mode` ∈ `primary|subagent|all`; `prompt` can be a file ref; `permission` (preferred over deprecated `tools`) gates `read/edit/bash/task/skill/...`.

### 2.2 Precedence (critical for "customize")
Loaded order (later overrides earlier): remote → global (`~/.config/opencode/opencode.json`) → `OPENCODE_CONFIG` env → project `opencode.json` → `.opencode` dirs → inline. A `.opencode` config overrides every direct config. So project-level `commands/`, `instructions`, `skills/`, `memory/` win over global. For *this* repo (the settings repo itself), edits land in-repo and become the new global defaults for the user.

---

## 3. How it works (constraints in THIS repo)

The repo's `conductor` (primary agent, `default_agent: "conductor"`) has **`write` and `edit` DENIED** (permissions + hook). From `opencode.jsonc` lines 87–118:
- `permission.edit: "deny"`, `permission.write: "deny"`, `tools.write: false`, `tools.edit: false`.
- BUT `bash`, `read`, `task`, `skill`, `glob`, `grep` are allowed, and the `memory_*` tools are separate from `write`/`edit` and are usable directly.

Consequence for any self-modifying command:
- **Config / commands / instructions** (file edits) → MUST delegate to the `coder` subagent (has `write`+`edit`) or `writer` (markdown). The conductor cannot touch files.
- **Memory** → conductor can use `memory_set`/`memory_replace` directly (these are memory tools, not file write/edit). Or delegate to a subagent that has the memory tools.
- The built-in `customize-opencode` skill (see 4.2) instructs the *active* agent to edit OpenCode's own config. Under `conductor` it would try to edit files and fail → it must delegate to `coder`. This is the single most important design constraint.

---

## 4. Key findings

### 4.1 Existing machinery (overlap map)
| Existing | What it does | Covers user's 4 targets? |
|---|---|---|
| `/learn` (`commands/learn.md`) | Reviews session/git, extracts patterns, **improves settings + memory**. Delegates: memory→`memory_set`, skill→`coder`, instructions→`writer`. | memory ✅, instructions ✅, settings(partial) ✅, **commands ❌**, **config ❌** |
| `continuous-learning` skill | Pattern categories reused by `/learn`. | supporting only |
| **`customize-opencode`** (BUILTIN, `packages/core/src/plugin/skill/customize-opencode.md`) | "Use ONLY when the user is editing or creating OpenCode's own configuration: opencode.json/jsonc, files under `.opencode/`, `~/.config/opencode/`, agents, subagents, skills, plugins, MCP servers, permission rules." | config ✅, commands ✅, instructions ✅, agents/skills/mcp ✅, **memory ❌** |
| `opencode-skill-creator` plugin | Full eval/iterate loop for creating/improving **skills** (with `skill_optimize_loop`, viewer). | skills only |
| `skill-from-history` skill | Generates a `SKILL.md` from git history patterns. | skills only |

**Gap:** No single entry point covers all four (commands, instructions, memory, config). `/learn` stops at settings+memory; `customize-opencode` stops at config+commands+instructions (not memory). Memory is split across two roots (`memory/` global, `.opencode/memory/` project).

### 4.2 The built-in `customize-opencode` skill is the key reusable asset
Source: `https://github.com/anomalyco/opencode/blob/dev/packages/core/src/plugin/skill/customize-opencode.md`. It:
- Inspects global (`~/.config/opencode/opencode.json`), project (`.opencode/` or `./opencode.json`), and `$OPENCODE_CONFIG` override.
- Knows variable substitution (`{env:VAR}`, `{file:path}`) and the ancillary folders (`.opencode/agents`, `commands`, `plugins`, `tools`, `themes`).
- Recommends: keep global defaults global, override per-project only when needed; store reusable prompts as `commands/`; keep tools small in `.opencode/tools/*.ts`; use interpolation for secrets/shared content; define a clear permission policy.

### 4.3 Memory is file-backed, two roots
`memory/human.md` + `memory/persona.md` (scope `global`) and `.opencode/memory/project.md` + `architecture.md` (scope `project`) are literally the memory blocks shown in-session. `memory_set`/`memory_replace` edit these `.md` files. So "improve memory" = edit the right root by scope. Gotcha: a command must pick the correct root or it will drift global vs project.

### 4.4 Command vs Skill decision
- **Command** = explicit, user-invoked entry point with `$ARGUMENTS` routing. Best for "I want to customize X now." Persisted as `commands/tune.md`.
- **Skill** = auto-invoked by model when intent detected; better for "silently apply a convention." The built-in `customize-opencode` is already a skill.
- Recommended: a **command** as the single user-facing entry point that internally routes to the right subagent / builtin skill / memory tools. This avoids duplicating the builtin skill and reuses `/learn`'s delegation pattern.

---

## 5. Relation to codebase (concrete refs)

- `opencode.jsonc` — lines 5–9 `instructions` array (env-interpolated paths); lines 313–426 `command` map using `{file:commands/X.md}` templates; lines 83–119 `conductor` write/EDIT deny; lines 454–457 `plugin: ["opencode-skill-creator","opencode-agent-memory"]`.
- `commands/learn.md` — existing delegation pattern to copy (memory→tool, skill→coder, instructions→writer).
- `commands/research.md` — shows the markdown-command + mode-detection style to mirror.
- `memory/*.md`, `.opencode/memory/*.md` — the memory roots to edit.
- `skills/opencode-skill-creator/SKILL.md` — skill-creation/eval loop if the "improve" target is a skill.
- `skills/skill-from-history/SKILL.md` — git-history → skill generation.

---

## 6. Actionable insights (recommended design)

**Recommendation: add a single command `/tune` (or `/customize`) that routes by target, reusing `customize-opencode` for config/commands/instructions and `/learn`'s flow for memory.** Do NOT reinvent the builtin skill.

Proposed `commands/tune.md` shape:
```
---
description: Customize OpenCode settings — commands, instructions, memory, or config (opencode.json/jsonc). Routes by $ARGUMENTS target.
agent: coder            # coder has write/edit for file artifacts
---
# Tune Command
Target one of: command | instruction | memory | config | agent | skill | mcp.
Parse $ARGUMENTS: first token = target, rest = specifics.

## Routing
- config / command / instruction / agent / skill / mcp
    → Load builtin `customize-opencode` skill knowledge; delegate file edits to `coder`
      (conductor cannot write). Respect {env:}/{file:} interpolation; edit project files in-repo.
- memory
    → Use memory_set/memory_replace directly. Pick root by scope:
      global → memory/*.md, project → .opencode/memory/*.md.
    → Ask user which block (persona/human/project/architecture) before writing.
## Rules (inherit from /learn)
- Always ASK before writing anything. Never auto-commit.
- Cite Source/s: for every claim.
- Keep global defaults global; override per-project only when needed.
```

Why `agent: coder` for file targets: `coder` already has `write`+`edit`+`bash` and `task` (so it can itself invoke `customize-opencode` via skill tool). For `memory` target, run in `conductor` (memory tools available) or a subagent granted `memory_*` — do NOT route memory to `coder` (coder lacks memory tools).

Alternative (lower effort): **extend `/learn`** to add `command`/`config`/`instruction` targets instead of a new command, since `/learn` already owns settings+memory. Either way, the delegation constraint (conductor can't write → coder/writer) is the non-negotiable rule.

Open questions for the user:
1. New command `/tune` vs extend `/learn`?
2. Should `memory` edits default to project (`.opencode/memory/`) or global (`memory/`)?
3. Auto-invoke via a skill too, or command-only?

---

## 7. Resources

- OpenCode Config docs: https://opencode.ai/docs/config/ and https://opencode.ai/v2/docs/config/
- OpenCode Commands docs: https://opencode.ai/v2/docs/commands and https://opencode.ai/docs/commands
- OpenCode Skills docs: https://opencode.ai/v2/docs/skills/ and https://opencode.ai/docs/skills/
- OpenCode Agents docs: https://opencode.ai/docs/agents/
- OpenCode Rules docs: https://dev.opencode.ai/docs/rules/ (instructions array, globs, URLs)
- Built-in `customize-opencode` skill source: https://github.com/anomalyco/opencode/blob/dev/packages/core/src/plugin/skill/customize-opencode.md
- Third-party playbook mirroring it: https://playbooks.com/skills/third774/dotfiles/customizing-opencode
- Instruction loading internals: https://github.com/anomalyco/opencode/blob/9afbdc10/packages/opencode/src/session/instruction.ts
- Repo references: `/data/sites/ai/settings-opencode/opencode.jsonc`, `commands/learn.md`, `commands/research.md`, `skills/opencode-skill-creator/SKILL.md`, `skills/skill-from-history/SKILL.md`, `memory/*.md`, `.opencode/memory/*.md`
