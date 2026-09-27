# OpenCode Config Precedence Rules

## Topic
How OpenCode resolves precedence when both global (`~/.config/opencode/opencode.jsonc`) and project-local (`./opencode.jsonc` or `.opencode/opencode.jsonc`) configs exist.

## Motivation
Need definitive answer on merge vs replace semantics for commands, instructions, and skills to correctly organize settings-opencode config hierarchy.

## Core Finding

**OpenCode MERGES configs, does NOT replace.** Each setting type has its own merge strategy.

---

## 1. JSON/JSONC Config (opencode.jsonc)

**Behavior: MERGE (deep merge, closer wins for conflicts)**

Source: `config.ts` line ~30-35

```ts
function mergeConfig(target: Info, source: Info): Info {
  return mergeDeep(target, source) as Info
}

function mergeConfigConcatArrays(target: Info, source: Info): Info {
  const merged = mergeConfig(target, source)
  if (target.instructions && source.instructions) {
    merged.instructions = Array.from(new Set([...target.instructions, ...source.instructions]))
  }
  return merged
}
```

**Precedence order (lowest → highest):**

1. `~/.config/opencode/opencode.jsonc` (global)
2. Project root `opencode.json(c)`
3. `.opencode/opencode.json(c)` (project, from root toward cwd)
4. Ancestor directories (monorepo walk-up)

Key details:
- `mergeDeep` = remeda's deep merge. Scalar values: closer file wins. Nested objects: merged recursively.
- **Exception: `instructions` array is CONCATENATED** (deduped via `Set`), not replaced. All files' instructions are combined.
- Arrays other than `instructions` are replaced by the closest file (standard `mergeDeep`).

Source: https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/config/config.ts

---

## 2. Commands (slash commands)

**Behavior: LATER DEFINITION WINS (last-write-wins per command name)**

Source: `config.ts` lines ~490-495 (in loadInstanceState loop):

```ts
result.command = mergeDeep(result.command ?? {}, yield* Effect.promise(() => ConfigCommand.load(dir)))
```

Commands from `.opencode/commands/*.md` are loaded per directory and deep-merged into `result.command`. Since each `.opencode/` directory in the upward walk is processed sequentially, **later directories override earlier ones** for the same command name.

**Precedence order (lowest → highest):**

1. Global `~/.config/opencode/commands/*.md` (via `ConfigCommand.load`)
2. Project root `.opencode/commands/*.md`
3. Closer `.opencode/commands/*.md` (toward cwd)
4. Commands defined in JSON config (`opencode.jsonc` → `commands` key) — merged via `mergeDeep` into the same result

**Per the docs:** "Project definitions take precedence over global definitions, and a later definition can override a built-in or earlier command with the same name."

Source: https://opencode.ai/v2/docs/commands/

---

## 3. Instructions (AGENTS.md)

**Behavior: COMBINED (not replaced), global first, then bottom-up**

Source: https://opencode.ai/v2/docs/instructions/

V2 loads:
1. Global `~/.config/opencode/AGENTS.md`
2. Every `AGENTS.md` from current Location up to home/project root

**Key:** "The files are combined rather than selecting a single winner. They are rendered in this order: global, then files from the Location toward home or the project root."

For `instructions` in JSON config (V2):
- "If more than one config defines `instructions`, the highest-precedence, closest config's entire array is selected; arrays are not merged."
- ⚠️ V2 currently **parses but does not resolve** the `instructions` array entries. Use `AGENTS.md` for active instructions.

Source: https://opencode.ai/v2/docs/instructions/

---

## 4. Skills

**Behavior: LATER SOURCE WINS (per skill ID)**

Source: https://opencode.ai/v2/docs/skills/

Precedence order (lowest → highest):

1. Built-in skills
2. `~/.claude/skills` → `~/.agents/skills` (global, compat)
3. `.claude/skills` → `.agents/skills` (project, compat)
4. `~/.config/opencode/skills` (global)
5. `.opencode/skills` (project, from root toward cwd)
6. Explicit `skills` config entries (in config priority + array order)

**If same skill ID in multiple sources:** later source wins. Avoid duplicate IDs unless intentional override.

Source: https://opencode.ai/v2/docs/skills/

---

## 5. Agents (file-based)

**Behavior: DEEP MERGE per directory walk**

Source: `config.ts` lines ~490-493:

```ts
result.agent = mergeDeep(result.agent ?? {}, yield* Effect.promise(() => ConfigAgent.load(dir)))
result.agent = mergeDeep(result.agent ?? {}, yield* Effect.promise(() => ConfigAgent.loadMode(dir)))
```

Agents from `.opencode/agents/*.md` are deep-merged per directory. Later directories override same-named agent properties.

---

## Summary Table

| Setting Type | Merge Strategy | Local Wins? | Conflict Resolution |
|---|---|---|---|
| JSON config scalars | Deep merge | Yes | Closer file wins |
| JSON config `instructions` | Concat + dedup | Combined | All sources kept |
| Commands (.md files) | Last-write-wins | Yes | Same name → closer wins |
| Skills | Last-source-wins | Yes | Same ID → later source wins |
| Agents (.md files) | Deep merge | Yes | Same name → closer wins |
| AGENTS.md | Combined | N/A | Global first, then bottom-up |

---

## Practical Implications for settings-opencode

- **Put shared/defaults in global** (`~/.config/opencode/opencode.jsonc` + `~/.config/opencode/commands/`)
- **Put project-specific overrides in local** (`.opencode/opencode.jsonc` + `.opencode/commands/`)
- **For skills:** `.opencode/skills/` overrides `~/.config/opencode/skills/` for same ID
- **For instructions:** combine via AGENTS.md — keep broad in global, scoped in local
- **Don't worry about REPLACE** — only `instructions` array in JSON config replaces (closest wins); everything else merges

## Resources

- Config docs: https://opencode.ai/v2/docs/config/
- Commands docs: https://opencode.ai/v2/docs/commands/
- Instructions docs: https://opencode.ai/v2/docs/instructions/
- Skills docs: https://opencode.ai/v2/docs/skills/
- Source: https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/config/config.ts
- Source: https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/config/command.ts
- Source: https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/config/paths.ts
