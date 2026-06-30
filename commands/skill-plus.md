---
description: Create, improve, or generate skills from history — /skill-plus --create|--from-history|--improve
---

# Skill Plus Command

Create, improve, or generate OpenCode skills. Runs in primary context — uses skill-creator plugin tools and skill-from-history instructions.

## Usage

```
/skill-plus --create|-c <name>         Create new skill from scratch
/skill-plus --from-history|-h <name>   Generate skill from git history analysis
/skill-plus --improve|-i <name>        Improve existing skill via eval/testing
```

## Modes

### --create / -c
Use skill-creator tools to scaffold a new skill:
1. `skill_validate` — check structure is valid
2. Write SKILL.md with name, description, usage patterns, examples
3. `skill_parse` — verify frontmatter

### --from-history / -h
Generate a skill from git history analysis:
1. Load `skills/skill-from-history/SKILL.md` for full instructions
2. Analyze git commits: `git log --oneline -100`, file change patterns
3. Identify recurring conventions, patterns, practices
4. Generate SKILL.md capturing those patterns

### --improve / -i
Improve an existing skill:
1. `skill_parse` — load current skill
2. `skill_eval` — test trigger accuracy with eval set
3. `skill_improve_description` — generate better description
4. `skill_optimize_loop` — run full optimization cycle

## Output

Creates skill at `skills/<name>/SKILL.md`.

$ARGUMENTS
