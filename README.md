# OpenCode Setup

> Forked from [fmflurry/settings-opencode](https://github.com/fmflurry/settings-opencode) at
> commit [`298dc371`](https://github.com/fmflurry/settings-opencode/commit/298dc371c129f18a7173e56d5cae909069ad61b6)
> and reoriented toward a different stack. Memory, agent architecture, and conventions have diverged
> significantly since then.
>
> **Big thanks to [@fmflurry](https://github.com/fmflurry)** for the original foundation.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode](https://img.shields.io/badge/OpenCode-CLI-000)](https://opencode.ai)

### Want to try it? Jump to **[Public install](#public-install)** — it takes about five minutes.

---

## What's different from fmflurry's original

This project reorients the upstream config from a .NET + frontend shop toward a **Node.js + framework-agnostic frontend** stack:

| Area | Upstream (fmflurry) | This project |
|------|-------------------|-----------|
| **Backend architecture** | .NET 8 Clean Architecture (`dotnet-clean-architecture`) | Node.js Clean Architecture (`nodejs-clean-architecture`: Fastify + Prisma + Zod) |
| **Frontend architecture** | Framework-specific standalone | Framework-agnostic Hexagonal Architecture (works with any) |
| **Accessibility skill** | Framework-specific a11y audit | Framework-agnostic frontend-accessibility |
| **Pre-merge review** | Framework-specific patterns   | Framework-agnostic (TS strict, architecture, state management) |
| **Domain-specific skill** | `flurryx` — custom state-management patterns | Not applicable; removed |
| **Subagent model env vars** | `OPENCODE_MODEL_SUBAGENT_WORKER` | Renamed to `OPENCODE_MODEL_SUBAGENT_PROGRAMMER` |
| **Autoskills** | None | `.agents/skills/`: `bash-defensive-patterns`, `frontend-design`, `nodejs-best-practices`, `use-ai-sdk` |
| **Development patterns** | Not present | `instructions/patterns/`: KISSME, SINE, POLA, SoC+CQS, CBD |
| **Verification gate** | Not present | `instructions/verification-gate.md`: build-verification enforcement before "done" |
| **Config style** | `{.config/opencode/...}` path literals | `{env:OPENCODE_SRC_ROUTE}/opencode/...` — env-driven for portability |
| **Skill reproducibility** | Not tracked | `skills-lock.json` — pins skill SHAs |
| **Package manager** | `package-lock.json` only | `bun.lock` (Bun-first) + `mise.toml` |
| **Env template** | Not present | `.env.example` — copy to `.env.local` and fill |

---

## What's inside

A hardened primary `conductor` agent backed by **16 specialist sub-agents** (planner, architect, coder, writer, code/security/database review, TDD, build-fix, e2e, doc, refactor, git, ask, researcher, merge-cop), wired together by:

- **Mandatory sub-agent delegation** from `conductor`: the primary has `write` and `edit` denied at the permission layer, plus a `tool.execute.before` hook that blocks bash redirects to source files (`> file.ts`, `tee`, `sed -i`, heredocs, `python -c open().write`). The orchestrator cannot patch files — every change MUST go through `coder` (source code), `writer` (docs/markdown/HTML), `tdd-guide` (tests), or `git-specialist` (commits/PRs). This makes routing **model-agnostic**: even open-weight models that ignore prose rules are mechanically forced to delegate.
- **Front-loaded first-tool gate** in `prompts/agents/conductor.txt`: hard rules at the top, routing table second, six few-shot User → `task` examples (with explicit wrong-way contrasts) so literal models copy the right pattern.
- **Slash commands** that force routing to the right specialist (`/plan`, `/tdd`, `/security`, `/code-review`, …).
- **Always-on skills** loaded at session start — Socratic design, security review, coding standards, git workflow, Serena bootstrap.
- **OpenCode plugins** — ECC hooks (Prettier + `tsc` on save), continuous-learning v2 (the *homunculus* instinct store), worktree spawner, auto-compact, caveman ultra mode, Figma RAG trigger, macOS notifications, startup bootstrap, persistent memory blocks (`opencode-agent-memory`).
- **Custom tools** — `run-tests`, `check-coverage`, `security-audit`, plus a codemap generator.
- **OpenCode-only** — no Claude Code mirror. The configuration is self-contained.

## Table of contents

- [Public install](#public-install)
- [Goals](#goals)
- [Repository layout](#repository-layout)
- [Configuration](#configuration-opencodejsonc)
- [Agents](#agents)
- [Slash commands](#slash-commands)
- [Skills](#skills)
- [Plugins & hooks](#plugins--hooks)
- [Custom tools](#custom-tools-tools)
- [TUI plugins](#tui-plugins)
- [Continuous learning](#continuous-learning)
- [How it fits together](#how-it-fits-together)

---

<a id="public-install"></a>
## Public install

There are two paths: a one-shot script (recommended) and a manual walk-through if you want to see every step.

### Prerequisites

- macOS or Linux (the worktree and notification plugins assume macOS — works on Linux with minor degradation).
- [OpenCode CLI](https://opencode.ai) installed and on your `PATH`.
- Either [Bun](https://bun.sh) (recommended — `bun.lock` is what's checked in) or Node.js 20+ with `npm`.
- `git`, plus `uv`/`uvx` for the Serena MCP server (`brew install uv` on macOS, or `pip install uv`).

### Quick install (script)

```bash
git clone https://github.com/YoelCieno/settings-opencode.git ~/Workspace/settings-opencode
cd ~/Workspace/settings-opencode
./install.sh
```

`install.sh` is interactive by default. It will:

1. Verify your prerequisites (`git`, `bun`/`npm`, `uv`).
2. Symlink the repo into `~/.config/opencode` (backing up any existing config to `*.bak.<timestamp>`).
3. Run `bun install` (or `npm ci` if Bun isn't available).
4. Add the `OPENCODE_MODEL_*` and `OPENCODE_REASONING_*` defaults to your shell rc, fenced with markers so re-runs and uninstalls are idempotent.
 5. Print a smoke-test command and the locations to tweak afterwards.

Useful flags:

| Flag | Behaviour |
| ---- | --------- |
| _(none)_ | Interactive walk-through with `[Y/n]` prompts and sensible defaults. |
| `--yes`, `-y` | Non-interactive — accept all defaults. Still backs up existing dirs before clobbering. |
| `--uninstall` | Remove the env-var block + the two symlinks. **Never deletes the cloned repo, your data, or `*.bak.*` backups.** |
| `--help`, `-h` | Print usage. |

The script writes a fenced block to your shell rc (`~/.zshrc`, `~/.bashrc`, or `~/.config/fish/config.fish`) that looks like this:

```bash
# >>> settings-opencode >>>
# Added by settings-opencode installer. Edit values to match your provider.
export OPENCODE_MODEL_PRIMARY="anthropic/claude-sonnet-4-6"
export OPENCODE_MODEL_SUBAGENT_PLANNER="anthropic/claude-opus-4-7"
export OPENCODE_MODEL_SUBAGENT_PROGRAMMER="anthropic/claude-sonnet-4-6"
export OPENCODE_MODEL_SUBAGENT_MINI="anthropic/claude-haiku-4-5"
export OPENCODE_REASONING_PRIMARY="high"
export OPENCODE_REASONING_SECONDARY="medium"
export OPENCODE_REASONING_TERTIARY="low"
# <<< settings-opencode <<<
```

Edit the values inside the markers to point at whichever provider you use. Re-running `./install.sh` rewrites the same block; `./install.sh --uninstall` removes it cleanly.

If your shell isn't bash/zsh/fish, the script prints the env block for you to paste manually and continues with the rest of the install.

### Manual install

<details>
<summary>Click to expand the step-by-step manual walk-through (same outcome as the script).</summary>

#### 1. Clone the repo into the OpenCode config dir

OpenCode loads `~/.config/opencode/opencode.jsonc` at startup, so the simplest install is to clone (or symlink) the repo there.

```bash
# Back up anything you already have there
mv ~/.config/opencode ~/.config/opencode.bak 2>/dev/null || true

# Clone
git clone https://github.com/YoelCieno/settings-opencode.git ~/.config/opencode
cd ~/.config/opencode
```

Prefer keeping the repo elsewhere? Symlink it instead:

```bash
git clone https://github.com/YoelCieno/settings-opencode.git ~/Workspace/settings-opencode
ln -s ~/Workspace/settings-opencode ~/.config/opencode
```

#### 2. Install plugin/tool dependencies

```bash
bun install        # uses bun.lock
# or
npm ci
```

#### 3. Set the model + reasoning environment variables

The `agent` block in `opencode.jsonc` is parameterized via env vars so you can swap providers without editing the config. Add these to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.):

```bash
# Required (OpenCode model identifiers — adjust to whatever provider you use)
export OPENCODE_MODEL_PRIMARY="anthropic/claude-sonnet-4-6"
export OPENCODE_MODEL_SUBAGENT_PLANNER="anthropic/claude-opus-4-7"
export OPENCODE_MODEL_SUBAGENT_PROGRAMMER="anthropic/claude-sonnet-4-6"
export OPENCODE_MODEL_SUBAGENT_MINI="anthropic/claude-haiku-4-5"

# Reasoning effort tiers
export OPENCODE_REASONING_PRIMARY="high"
export OPENCODE_REASONING_SECONDARY="medium"
export OPENCODE_REASONING_TERTIARY="low"
```

If your provider doesn't support `reasoningEffort`, OpenCode silently ignores it — pick any value.

#### 4. Install MCP server prerequisites

`opencode.jsonc` declares four MCP servers. **Serena is required** — `instructions/serena.md` is loaded on every session and will fail to activate without it. The others are optional but documented here so you know what you're opting into.

| Server     | Install                                                                                       | Status                                                                       |
| ---------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| serena     | `pip install uv` (or `brew install uv`) — the config invokes `uvx --from git+https://github.com/oraios/serena serena start-mcp-server` | **Required.** IDE-grade semantic code retrieval used by `instructions/serena.md`. |
| context7   | nothing — `npx -y @upstash/context7-mcp@latest` is auto-installed at session start            | Live docs lookup. Auto-bootstraps on first use.                              |
| wallaby    | install [Wallaby.js](https://wallabyjs.com) and run `wallaby update-mcp`                      | Optional. Runtime-test introspection.                                        |
| Figma      | `enabled: false` by default                                                                   | Optional. Flip `enabled: true` and set up [Figma MCP](https://help.figma.com) for design-system tools. |

</details>

### Smoke test

```bash
opencode
```

You should see:

- The caveman ultra TUI sidebar plugin show up (or be silent if you're not in a caveman session).
- `instructions/serena.md` ask Serena to activate the project on first user message.
- The continuous-learning v2 injector preload high-confidence instincts into the system prompt.

Then drop a slash command:

```
/plan add a TODO list to my homepage
```

It should route to the `planner` sub-agent and return a structured plan without writing code.

### Updating

```bash
cd ~/.config/opencode
git pull
./install.sh --yes        # refreshes deps + env block; idempotent
# or, if you want to do it by hand:
# bun install   (or: npm ci)
```

If a new plugin shows up, OpenCode picks it up on the next restart. If an env var is added to `opencode.jsonc`, this README will mention it.

### Starting a new project

After installing this config, when you start a new app project:

1. `cd /path/to/new-project`
2. `opencode .`
3. type `/init` in the TUI prompt

`/init` is a **built-in TUI slash command** (not a CLI subcommand — it does not appear in `opencode --help`). It scans your project, detects the tech stack, build/lint/test commands, and conventions, then creates `AGENTS.md` in the project root (~150 lines, concise). The agent reads this file on every session for project-specific context.

If `AGENTS.md` already exists, `/init` improves it in place rather than overwriting. You should commit `AGENTS.md` to Git to share context with your team.

You can also pass extra instructions: `/init Pay special attention to TypeScript type safety`.

---

### Goals

- Reproducibility: same agent behavior across machines/sessions.
- Quality: on-demand TDD, frequent verification, centralized conventions.
- Security: `security-review` skill loaded by default + pre-tool-use hooks.
- Continuous improvement: automatic pattern extraction from sessions surfaced as learned skills.

### Repository layout

- Configs: `opencode.jsonc`, `dcp.jsonc` (dynamic context pruning), `ocx.jsonc` (OCX registries), `tui.json` (TUI theme).
- Profiles: `profiles/<name>/` (per-profile overrides + `AGENTS.md`, run with `ocx opencode -p <name>`).
- Skills: `skills/*/SKILL.md` (plus auxiliary docs).
- Agent prompts: `prompts/agents/*.txt`.
- Slash commands: `commands/*.md` — includes `ask`, `research`, `git-workflow`, `cop-review`, `skill-from-*` variants.
- OpenCode plugins: `plugins/*.{ts,js}` + `plugins/kdco-primitives/`, `plugins/worktree/`.
- TUI plugins: `tui-plugins/*.tsx`.
- Custom tools: `tools/*.ts`.
- Mode notes: `contexts/*.md`.
- Global instructions: `instructions/subagent-routing.md`, `instructions/serena.md`, `instructions/caveman-ultra.md`, `instructions/verification-gate.md`.
- Development patterns: `instructions/development-patterns.md` (+ `instructions/patterns/` — KISSME, SINE, POLA, SoC+CQS, CBD).
- Scripts: `scripts/setup-package-manager.js`, `scripts/codemaps/generate.ts`.
- Env template: `.env.example` (copy to `.env.local` and fill).
- Skill lockfile: `skills-lock.json` (pins skill SHAs for reproducibility).
- Zed rules: `.rules` — mirrors coding standards, verification gate, git conventions for Zed Agent Panel.
- Git strategy: `GIT-STRATEGY.md` — dev/main squash-merge workflow.
- `.claude/skills/` — external skill catalog (auto-discovered by opencode)
- Intentional exclusions (`.gitignore`): `.serena/` local MCP state, `node_modules/`, `.instinct-digest-state.json`, `antigravity-*`, `.DS_Store`, local `.env*` files except `.env.example`.

### Configuration: `opencode.jsonc`

Six concerns wired in one file:

1. `instructions`: always-on skills loaded at session start. Currently:
   - `instructions/subagent-routing.md` — Task-first subagent delegation gate.
   - `instructions/serena.md` — activates Serena MCP after the routing gate when specialist delegation does not apply.
   - `skills/socratic-design/SKILL.md` — evidence-first decision gating.
   - `skills/security-review/SKILL.md` — OWASP checklist.
   - `skills/coding-standards/SKILL.md` — code conventions.
   - `skills/git-workflow/SKILL.md` — branches, commits, PRs.
2. `default_agent`: `conductor` (orchestrator-only — cannot write/edit).
3. `agent`: sub-agent definitions (model + reasoning effort + prompt + tool allowlist). All models are env-driven (`OPENCODE_MODEL_*`, `OPENCODE_REASONING_*`) — see [Public install § 4](#public-install).
4. `command`: maps `/<name>` -> template + sub-agent + `subtask`.
5. `mcp`: serena, context7, Figma (disabled).
6. `plugin`: external marketplace plugins (`@tarquinen/opencode-dcp@latest`, `opencode-agent-memory`).

`dcp.jsonc` configures the Dynamic Context Pruning plugin. `ocx.jsonc` registers OCX [registries](https://ocx.kdco.dev).

### Agents

Defined in `opencode.jsonc` under `agent`:

| Agent                  | Mode     | Role                                                                                |
| ---------------------- | -------- | ----------------------------------------------------------------------------------- |
| `conductor`            | primary  | Orchestrator. `write` + `edit` **denied** at the permission layer. Routes every change to a specialist via Task. Bash redirects to source files blocked by the ECC pre-tool hook. |
| `planner`              | subagent | Plan + risks before large changes. Read+bash, no edit.                              |
| `architect`            | subagent | System design / scalability decisions. Read+bash only.                              |
| `coder`                | subagent | Pure non-test implementation. Mandatory build+lint+standards self-check before reporting done. Socratic ambiguity gate. |
| `writer`               | subagent | Writes docs/markdown/HTML/text artifacts. Forbidden from touching source code — refuses out-of-scope files back to the conductor. |
| `code-reviewer`        | subagent | Quality review over diffs and conventions. Read-only — findings only; fixes go to `coder`. |
| `security-reviewer`    | subagent | OWASP/secrets/deps review. Read-only — reports vulnerabilities; remediation routed to `coder`. |
| `merge-cop`            | subagent | Pre-merge code review of HEAD vs target branch. Read-only — runs tsc + lint, emits tiered report (junior/senior). |
| `tdd-guide`            | subagent | RED -> GREEN -> REFACTOR + 80% coverage. Writes tests; delegates GREEN impl to `coder` via scoped Task perm. |
| `build-error-resolver` | subagent | Build/TS error fixes with minimal diffs.                                            |
| `e2e-runner`           | subagent | Playwright E2E tests.                                                               |
| `doc-updater`          | subagent | Generated docs + codemaps.                                                          |
| `refactor-cleaner`     | subagent | Dead-code removal + consolidation.                                                  |
| `database-reviewer`    | subagent | PostgreSQL / Supabase schema, perf, security.                                       |
| `researcher`           | subagent | Multi-source research + comparison analysis. Read-only; writes to `.opencode/thoughts/comparisons/`. |
| `ask`                  | subagent | General-purpose Q&A. Investigates codebase, docs, technologies via Context7. Delegates deep research to `researcher` (asks first). Read-only. |
| `git-specialist`       | subagent | Branches, commits, pushes, PRs (mini model).                                        |

### Hardened sub-agent orchestration

Delegation is enforced at **three layers**, so the same behavior holds whether the primary model is Claude, GPT, DeepSeek, or any open-weight runner that ignores prose hints:

1. **Permissions** — `conductor` has `tools.write: false`, `tools.edit: false`, and `permission.edit/write: deny` in `opencode.jsonc`. The Task allowlist enumerates every legal specialist; `*: deny` blocks anything else. The orchestrator literally has no file-mutation tool.
2. **Pre-tool hook (`plugins/ecc-hooks.ts`)** — defense in depth: blocks bash commands that would write to source files via shell redirect (`>`, `>>`), `tee`, `sed -i`, heredocs, or `python -c open().write`. Throws aborting the tool call with an explicit "delegate to coder/writer/tdd-guide" message. Applies globally — no subagent should be writing code through bash either.
3. **Front-loaded prompt (`prompts/agents/conductor.txt`)** — hard rules in the first lines, routing table second, six worked few-shot examples showing User → `task` calls with explicit wrong-way contrasts. `instructions/subagent-routing.md` enforces a Task-first gate before direct inspection.

Use these paths depending on how much control you want:

- Plain request: `conductor` consults the routing table and dispatches the matching specialist via Task.
- `@agent` mention: manually invokes a specific subagent in the conversation.
- Slash command: forces a subtask with a configured template, e.g. `/plan`, `/tdd`, `/security`.

Why this exists: GPT/Claude often infer delegation from short descriptions, but open-source/open-weight models are more literal and tend to inspect or edit first. Permissions + the hook + the front-loaded gate make delegation **mechanically enforced** rather than instruction-dependent.

### Slash commands

Templates in `commands/`. Most run as `subtask: true` (delegated to a specialist).

| Command                  | Sub-agent             | Purpose                                          |
| ------------------------ | --------------------- | ------------------------------------------------ |
| `/git`                   | git-specialist        | Bounded git ops (subcommands: s/c/ps/scps/b/a/bcl). |
| `/git-workflow`          | git-specialist        | Full git workflow: create branch → commit → push → PR. Subcommands: bcps, bscps, cps, mrsq. |
| `/plan`                  | planner               | Implementation plan.                             |
| `/tdd`                   | tdd-guide             | TDD cycle with coverage.                         |
| `/code-review`           | code-reviewer         | Quality review.                                  |
| `/security`              | security-reviewer     | Security audit.                                  |
| `/build-fix`             | build-error-resolver  | Build/TS error resolution.                       |
| `/e2e`                   | e2e-runner            | E2E test generation/run.                         |
| `/refactor-clean`        | refactor-cleaner      | Dead-code cleanup.                               |
| `/cop-review`            | merge-cop             | Pre-merge review of HEAD vs target branch.       |
| `/update-docs`           | doc-updater           | Doc updates.                                     |
| `/update-codemaps`       | doc-updater           | Generates `docs/CODEMAPS/`.                      |
| `/test-coverage`         | tdd-guide             | Coverage analysis.                               |
| `/research`              | researcher            | Structured multi-source research + comparison.   |
| `/ask`                   | ask                   | General Q&A about project, tech, plans.          |
| `/skill-from-history`    | (primary)             | Generate a skill from git history analysis.      |
| `/skill-from-instinct`   | (primary)             | Cluster instincts into skills.                   |
| `/instinct-status`       | (primary)             | View learned instincts with confidence.          |
| `/instinct-import`       | (primary)             | Import instincts from file/URL.                  |
| `/instinct-export`       | (primary)             | Export instincts for sharing.                    |

### Skills

Always-on:

- `.agents/skills/` — autoskills loaded automatically by OpenCode: `bash-defensive-patterns`, `frontend-design`, `nodejs-best-practices`, `use-ai-sdk`.

Declared in `instructions`:

- `skills/socratic-design/SKILL.md` — evidence-first decision gating.
- `skills/security-review/SKILL.md` — security checklist + scenarios.
- `skills/coding-standards/SKILL.md` — naming, immutability, file size, error handling.
- `skills/git-workflow/SKILL.md` — branches, conventional commits, push guards.
- `instructions/serena.md` — connects Serena MCP per session.

New skills on-demand (loaded by description / by command):

- `skills/ask/SKILL.md` — general-purpose Q&A agent for questions about project, editor, technologies.
- `skills/nodejs-clean-architecture/SKILL.md` (+ playbooks) — Fastify + Prisma + Zod scaffolding.
- `skills/frontend-hexagonal-architecture/SKILL.md` (+ framework-wiring, implementation-playbooks) — Framework-agnostic Hexagonal Architecture for any frontend framework.
- `skills/tdd-workflow/SKILL.md` — full TDD methodology.
- `skills/caveman/SKILL.md`, `caveman-commit`, `caveman-review` — terse mode.
- `skills/strategic-compact/SKILL.md` — manual compaction at logical breakpoints.
- `skills/frontend-accessibility/SKILL.md` — Framework-agnostic a11y audit and fixes.

### Plugins & hooks

All TypeScript plugins use `@opencode-ai/plugin@1.4.6`.

- `plugins/ecc-hooks.ts` — Prettier on edited JS/TS, `console.log` detection, sensitive-command reminders (`git push` etc.), and the **conductor hard-stop**: aborts bash redirects (`>`, `>>`, `tee`, `sed -i`, heredocs, `python -c open().write`) targeting source files so delegation cannot be bypassed via shell.
- `plugins/continuous-learning-stop-hook.js` — legacy v1 stop hook, calls `skills/continuous-learning/bin/evaluate-session.js` to write a draft into `skills/learned/`.
- `plugins/auto-compact.js` — auto-compacts once `OC_COMPACT_THRESHOLD` tool calls are reached, only while idle.
- `plugins/notification.js` — macOS notification + sound on `session.idle`.
- `plugins/caveman-server.ts` + `tui-plugins/caveman.tsx` — injects caveman instructions into the system prompt + TUI sidebar showing active mode.
- `plugins/figma-mcp-trigger.js` — Figma RAG: reads `figma-rag.md` (or `OPENCODE_FIGMA_RAG_PATHS`) and injects snippets when designs are referenced.
- `plugins/worktree.ts` (+ `plugins/worktree/`) — creates an isolated git worktree for the session and spawns a terminal (mac/Win/Linux). Inspired by opencode-worktree-session.
- `plugins/startup-bootstrap.ts` — runs `serena_activate_project` on the first tool call of a session.
- `plugins/kdco-primitives/` — shared utilities (mutex, shell, terminal-detect, project-id resolver, types).
- `opencode-agent-memory` *(external, declared in `opencode.jsonc › plugin`)* — Letta-style persistent memory blocks (`memory_list`, `memory_set`, `memory_replace`) + optional journal. Data in `~/.config/opencode/memory/*.md` (global) + `.opencode/memory/*.md` (project).
- `@tarquinen/opencode-dcp@latest` *(external, declared in `opencode.jsonc › plugin`)* — Dynamic Context Pruning. Trims stale tool results and large files from the live context window so long sessions don't blow past the model's limit. Configured via `dcp.jsonc` at the repo root.

### Custom tools (`tools/`)

Reusable OpenCode tools exposed via `tools/index.ts`:

- `tools/run-tests.ts` — detects package manager + framework and builds the test command.
- `tools/check-coverage.ts` — reads coverage reports and compares against a threshold.
- `tools/security-audit.ts` — scans deps + secrets + risky patterns.

### TUI plugins

`tui-plugins/caveman.tsx` — React sidebar that shows a "CAVEMAN ULTRA" badge when the mode is active (flag file written by `caveman-server.ts`).

### Continuous learning

Two pipelines coexist (backwards compat):

1. **v1 (legacy)** — `plugins/continuous-learning-stop-hook.js` -> `skills/continuous-learning/stop.sh` -> `skills/continuous-learning/bin/evaluate-session.js` writes at most one draft into `skills/learned/`.

Curation:

- `/curate-learned-skills` (Claude Code side) — reviews drafts in `learned/` and promotes the valuable ones into real skills.
- `/instinct-status` — inspect learned instincts.
- `/skill-from-instinct` — cluster high-confidence instincts into reusable skills.

### How it fits together

1. Startup: OpenCode loads `opencode.jsonc` -> always-on instructions -> `caveman-server` adds caveman preamble if active.
2. First user action: `startup-bootstrap` triggers `serena_activate_project`.
3. Dev: `conductor` executes — it cannot write files; it dispatches Task calls to specialists. `ecc-hooks` formats / flags `console.log` / blocks bash-write bypasses. `instinct-observer` archives events.
4. Workflow: `conductor` routes to specialists through Task (perm-enforced); `/plan`, `/tdd`, `/security`, etc. force the same routing explicitly.
5. Idle: `auto-compact` triggers when the tool-call threshold is reached; `notification` pings macOS.
6. Stop: v1 hook writes a draft; v2 daemon clusters observations into instincts for the next session.
