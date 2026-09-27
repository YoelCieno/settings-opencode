---
description: Tune opencode settings — commands, instructions, or config. --local/--global scope. Invokes customize-opencode skill; delegates file writes to coder.
---

# Tune Command

Customize opencode settings by target — commands, instructions, or config.

## Usage

```
/tune                            Ask: what to tune + scope
/tune --global command <name>   Tune ~/.config/opencode/commands/<name>.md
/tune --local command <name>    Tune ./commands/<name>.md (project-local)
/tune --global config           Tune ~/.config/opencode/opencode.jsonc
/tune --local config            Tune ./opencode.jsonc (project-local)
/tune --global instruction <f>  Tune ~/.config/opencode/instructions/<f>.md
/tune --local instruction <f>   Tune ./instructions/<f>.md
/tune <path>                    Auto-detect scope + target from path
```

## Scope Selection

Two config scopes exist:
- **Global** (`~/.config/opencode/`) — your personal settings, shared across all projects
- **Local** (project root `./`) — project-specific overrides, wins on conflict

Flag parsing:
- `--global` → target global root (`~/.config/opencode/`)
- `--local` → target project root (`./`, i.e. `pwd`)
- No flag → ask user: "Target global or local scope?" (default: local if cwd has `opencode.jsonc`, else global)
- If cwd IS the global root (`~/.config/opencode`), then `--local` and `--global` resolve to same path — tell user this.

Precedence: local overrides global per command name. `instructions` array: closest file wins entirely (no merge).

## Target Routing

1. Resolve scope: `--global` → `~/.config/opencode/`, `--local` → `./`, no flag → ask/auto-detect.
2. Detect target from `$ARGUMENTS` / path:

   - `command <name>` → `<scope>/commands/<name>.md`
   - `instruction <file>` → `<scope>/instructions/<file>.md`
   - `config` → `<scope>/opencode.jsonc`
   - Bare `<path>` → auto-detect scope + target from path
   - `memory/*` → redirect to `/learn`
   - `skills/*` → redirect to `/skill-plus`
   - Ambiguous → ask user: "Which target? (command | instruction | config)"

Handles: **commands** (`commands/<name>.md`), **instructions** (`instructions/<file>.md`), **config** (`opencode.jsonc`).
Does NOT handle: **memory** (redirect to `/learn`), **skills** (redirect to `/skill-plus`).

## Workflow (all targets)

1. Invoke `customize-opencode` skill via skill tool — load schema + precedence for the target. NEVER guess config field names. Always consult the skill or official docs first.
2. Plan the change; show user the diff plan (file, field, why).
3. Ask user to confirm before writing — wait for explicit yes.
4. Delegate the file write to `coder` subagent via Task tool (conductor `write`/`edit` DENIED) with exact path + change + constraint: must validate against `customize-opencode` schema — no guessed fields.
5. After write, verify: config → JSONC parse check; command/instruction → file exists + valid frontmatter (`description` required).
6. Report what changed + `Source/s:` line citing docs/skill consulted.

## Constraints

- Conductor has `write`/`edit` DENIED. ALL file mutations MUST be delegated to the `coder` subagent via Task tool. Memory tools (`memory_set`/`memory_replace`) are the only direct-write exception — but memory is out of scope here.
- NEVER guess config field names. Always load `customize-opencode` skill (skill tool) or consult official docs first.
- NEVER auto-commit. Ask before commit/push (route to git-specialist via Task if user confirms).
- Always ask the user to CONFIRM the planned change before delegating the write to coder.
- Scope must be explicit (`--local`/`--global`) or auto-detected before any file operation. Never assume scope.

## Source Citation

End every run with `Source/s: <urls/docs>` listing the skill/docs consulted.

$ARGUMENTS
