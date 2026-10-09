---
name: memory-status
description: >
  Summarize active memory blocks, loaded skills, and MCP servers. Invoked when user
  says "memory status", "check memory", "what do you know", or runs /memory-status.
  Read-only diagnostic/introspection tool — never modifies memory or configuration.
---

# Memory Status Skill

Generate a structured summary of the current agent memory, loaded skills, and MCP configuration.

## When to Activate

- User says "memory status", "check memory", "what do you know", "context check"
- Before starting a complex task to verify context availability

## Procedure

1. **Memory Blocks**
   - Call `memory_list` to enumerate all active blocks (try `scope="all"` if the default is empty)
   - For each block report: label, description, `chars_current` / `chars_limit`, key content summary (2–3 sentences)

2. **Loaded Skills**
   - Reference the `<available_skills>` section in system instructions
   - List each: name, description, trigger scenarios
   - Note which are preloaded vs loaded-on-demand

3. **MCP Servers**
   - Read `opencode.jsonc` and extract the `mcp` section
   - For each server: name, type (local/remote), enabled/disabled status, command or URL

## Output Format

Present as clean sections with markdown headings and tables. Be concise but comprehensive — this is a diagnostic/introspection tool.

### Memory Section
```
| Block | Chars | Summary |
|-------|-------|---------|
| ...   | ...   | ...     |
```

### Skills Section
```
| Skill | Loaded | Trigger |
|-------|--------|---------|
| ...   | ...    | ...     |
```

### MCP Section
```
| Server | Type | Command/URL | Enabled |
|--------|------|-------------|---------|
| ...    | ...  | ...         | ...     |
```

## Notes

- If `memory_list` returns unexpected results, adapt gracefully and report what you found
- If `opencode.jsonc` isn't directly readable from the shell, read it via the Read tool
- Read-only: never write to memory blocks or config from this skill
