# /learn Command Plan

## Goal
Add `/learn` slash command to OpenCode config that:
- Reviews session context or git commits for patterns
- Suggests improvements to settings (instructions, skills, workflows, agents)
- Adds lessons learned to memory (global or project, user chooses)
- Follows KISSME — thin layer, no new agents, no plugins

## Design Decision
**Option A (chosen)**: Primary-context command, no dedicated agent.
- `commands/learn.md` template loaded in primary context
- Conductor reads context, presents findings, asks user, delegates writes to writer/coder
- Same pattern as `/discuss`

## Command Syntax
```
/learn                    → ask: which mode? (session/git)
/learn --session          → analyze current context window for patterns
/learn --git              → analyze last commit (default range)
/learn --git <range>      → git log range (e.g., HEAD~3..HEAD, abc123..def456)
/learn --git -<N>         → last N commits (e.g., --git -5)
```

## Workflow

### --session mode
1. Conductor reads: current context (memory blocks, loaded skills, recent user corrections)
2. Detects patterns: repeated corrections, error resolutions, conventions established
3. Presents findings with suggested actions
4. Asks user:
   - "Save to which memory? (persona/human/project/architecture)"
   - "Create/update skill? (name/slug)"
   - "Update instructions file?"
5. Delegates writes to writer (mem/docs) or coder (config/skills)

### --git mode
1. Runs `git log --oneline <range>` to list commits
2. For each commit: `git show --stat` for file change patterns
3. Detects: recurring file types changed, fix patterns, convention drift
4. Same output flow as --session

## Files to Create/Modify

### Create: `commands/learn.md`
Command template file (markdown with YAML frontmatter).

### Modify: `opencode.jsonc`
Add `/learn` command entry in `"command"` section:
```json
"learn": {
  "description": "Review session or git context to improve settings and memory",
  "template": "{file:commands/learn.md}\n\n$ARGUMENTS"
}
```

### Simplify: `skills/continuous-learning/`
Keep only pattern definitions as reusable module:
- `SKILL.md` → trim to just when-to-use and reference to `/learn`
- `bin/patterns.js` (new) → extract PATTERN_DEFS, buildSkillContent, deriveDescriptiveSlug, scorePattern, collectExamples
- Delete: `stop.sh`, `hooks/`, `config.json`, `evaluate-session.js`, `evaluate-session.test.js`

## Dependencies
None — pure OpenCode config changes

## Risks
- LOW: Session analysis limited to context window (can't read raw transcript mid-session)
- LOW: Git analysis needs git in PATH (always available)
