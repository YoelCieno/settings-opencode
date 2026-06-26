---
name: memory-status
description: >
  Summarize active memory blocks, loaded skills, and project context. Invoked when
  user says "memory status", "check memory", "what do you know". Inspects Qwen Code's
  file-based memory system and available skills/MCP servers.
---

# Memory Status Skill

Generate a structured summary of current agent memory, loaded skills, and project context.

## When to Activate

- User says "memory status", "check memory", "what do you know", "context check"
- Wanting to understand what the agent remembers and has access to
- Before starting a complex task to verify context availability

## Procedure

1. **Memory Blocks**
   - Read `/home/fer/.qwen/projects/*/memory/MEMORY.md` (the index file)
   - For each memory file referenced in the index, report: name, type, key content summary (2-3 sentences)

2. **Loaded Skills**
   - Reference the `<available_skills>` section in the current system instructions (built-in skills)
   - Scan `~/.qwen/skills/` for user-installed skills (symlinked directories)
   - List each: name, description from SKILL.md frontmatter, symlink status

3. **Project Context**
   - Check `AGENTS.md` at project root (auto-loaded every turn)
   - Check `.opencode/references/` for reference docs (WebAwesome skill, etc.)
   - Check `docs/` for project documentation

4. **MCP Servers**
   - Check `/data/sites/ai/settings-opencode/opencode.jsonc` → `mcp` section
   - For each server: name, type (local/remote), command or URL, enabled status

## Output Format

Present as clean sections with markdown headings and tables. Be concise but comprehensive — this is a diagnostic/introspection tool.

### Memory Section
```
| Name | Type | File | Summary |
|------|------|------|---------|
| ...  | ...  | ...  | ...     |
```

### Skills Section
```
| Name | Type (built-in/user) | Description | Status |
|------|----------------------|-------------|--------|
| ...  | ...                  | ...         | ...    |
```

### MCP Section
```
| Server | Type | Command/URL | Enabled |
|--------|------|-------------|---------|
| ...    | ...  | ...         | ...     |
```

---

**NOTE**: This is a read-only diagnostic tool. It does not modify memory or configuration.
