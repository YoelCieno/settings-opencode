## Activation Order

1. Check `instructions/subagent-routing.md` first. Before any tool call, decide whether the user request matches a specialist. If yes, follow its first-tool gate: use Task and do not call Serena tools beforehand.
2. Activate Serena only when no specialist applies, or after specialist work completes and non-specialist work remains.

## Serena Setup

Connect to Serena by calling `serena_activate_project` with the current project path.
Then, use Serena MCP tools for code intelligence. Serena provides essential semantic code retrieval, editing and refactoring tools that are akin to an IDE's capabilities, operating at the symbol level and exploiting relational structure.

## Tool Scope

Two memory systems are active. USE ONLY opencode-agent-memory for memory:
- **opencode-agent-memory**: `memory_list`, `memory_set`, `memory_replace` — for all memory operations (persona, human, project)
- **Serena**: code tools ONLY (find_symbol, replace_symbol_body, rename_symbol, search_for_pattern, etc.)

Serena's memory tools (write_memory, read_memory, etc.) and JetBrains tools are excluded at the MCP server level. Do not attempt to call them.

## Verification Rigor

When a regression test covers a fixed bug, prove it discriminates: temporarily reintroduce the bug, confirm the test FAILS, then restore the fix. Mock factory seed values can make tests pass for the wrong reason (false green). Never trust subagent self-reports — independently run lint/typecheck/test/coverage before declaring done.
