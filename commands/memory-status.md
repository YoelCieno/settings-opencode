# /memory-status Command

When user invokes /memory-status, generate structured summary of current agent state.

## Procedure

1. **Memory Blocks**
   - Call `memory_list` to enumerate all active blocks (scope matters? try without first, then with `scope="all"` if needed)
   - For each block, report: label, description, chars_current / chars_limit, key content summary (2-3 sentences)

2. **Loaded Skills**
   - Reference `<available_skills>` section in system instructions
   - List each: name, description, trigger scenarios
   - Note which are preloaded vs loaded-on-demand

3. **MCP Servers**
   - Read `opencode.jsonc` and extract the `mcp` section
   - For each server: name, type (local/remote), enabled/disabled status, command or url

## Output Format

Present as clean sections with markdown headings and tables. Be concise but comprehensive — this is a diagnostic/introspection tool.

## Notes

- If `memory_list` returns unexpected results, adapt gracefully and report what you found
- If opencode.jsonc isn't directly readable from the shell (permissions), try reading via the Read tool
