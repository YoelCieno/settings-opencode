---
description: Review session or git context to improve settings and memory
---

# Learn Command

Review session context or git history to extract patterns, improve settings, and save lessons.

## Usage

```
/learn                       Ask: which mode? (session/git)
/learn --session             Analyze current context for patterns
/learn --git                 Analyze last commit
/learn --git <range>         Analyze specific commit range (e.g., HEAD~3..HEAD, abc123..def456)
/learn --git -<N>            Analyze last N commits (e.g., --git -5)
```

## Your Task

You are the primary conductor-agent. You have NO write access — delegate all changes to subagents (writer for docs/memory, coder for config/skills).

### Mode Detection

Check first argument:

1. No args → ask user: "Session review or git review?"
2. `--session` → Session Review mode
3. `--git` → Git Review mode (default: last commit, parse following args as range)

### --session Mode

1. **Read current state** — inspect active memory blocks (`memory_list --scope all`), loaded skills, recent context from the conversation
2. **Detect patterns** — scan conversation for:
   - User corrections ("actually", "instead", "prefer", "not this")
   - Error resolution patterns (repeated fixes, diagnostics)
   - Convention establishment ("always do X", "we use Y pattern")
   - Workarounds or temporary solutions
3. **Present findings** to user as concise list
4. **Ask user**:
   - "Save lesson to which memory? (persona/human/project/architecture)"
   - "Create or update a skill? (name?)"
   - "Update instructions file? (which one?)"
5. **Delegate writes**:
   - Memory updates → `memory_set` or `memory_replace` (tool, not subagent)
   - Skill creation → `coder` task to create `skills/<name>/SKILL.md`
   - Instructions edit → `writer` task to edit `instructions/<file>.md`

### --git Mode

1. **Parse range**:
   - No range → `HEAD~1..HEAD` (last commit)
   - `-<N>` → `HEAD~<N>..HEAD` (last N commits)
   - `<sha1>..<sha2>` → use as-is
   - Single ref → `<ref>~1..<ref>` (single ref means one commit)
2. **Gather data**:
   - `git log --oneline <range>` — commit subjects
   - `git show --stat <range>` — file change summary per commit
   - `git diff <range> -- ` — actual diff (use `--stat` first, only show full diff if patterns not clear)
   - `git log --format="%B" <range>` — full commit messages
3. **Detect patterns**:
   - Repeated file types changed (e.g., multiple migrations in separate commits)
   - Fix vs feature ratio
   - Convention drift (naming inconsistencies, style breaks)
   - Missing tests or docs in same-change commits
4. **Present findings** to user
5. **Same ask + delegate flow** as --session mode

## Pattern Categories (for detection)

Use these categories when scanning context or git diffs:

- **error_resolution**: error, stack trace, exception, fix, failing test, regression, diagnose, root cause
- **user_corrections**: correction, actually, instead, prefer, should be, not this, adjust, revise
- **workarounds**: workaround, temporary, fallback, mitigate, unblock, hotfix, short-term
- **debugging_techniques**: debug, investigate, log, trace, breakpoint, reproduce, isolate, hypothesis
- **project_specific**: convention, guideline, architecture, lint, naming, pattern

## Output Rules

1. Always ask before writing anything — never auto-commit changes
2. Present findings as bullet list with pattern category labels
3. Ask user which memory to save to (list available blocks with memory_list)
4. Ask before creating/updating skills or instructions
5. Source: `file:codebase/path` or `git:<hash>` for every claim

## Sources

At end of response, include `Source/s:` line citing all evidence referenced.
