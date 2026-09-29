---
description: Create, improve, or generate skills from history — /skill-plus --create|--from-history|--improve
---

# Skill Plus Command

Create, improve, or generate OpenCode skills. Instructions-only workflow — no plugin tools. Validation via the `skill-check` CLI.

## Usage

```
/skill-plus --create|-c <name>         Create new skill from scratch
/skill-plus --from-history|-h <name>   Generate skill from git history analysis
/skill-plus --improve|-i <name>        Improve existing skill
```

## Modes

### --create / -c
1. Load `skills/opencode-skill-creator/SKILL.md` for full workflow (intake interview gate, writing guide, description rules)
2. Draft `skills/<name>/SKILL.md` — frontmatter `name` + `description`, then body
3. Validate:
   ```
   npx -y skill-check check skills/<name> --no-security-scan --no-open
   ```
   exit 0 = pass. Fix reported errors, re-run until clean.

### --from-history / -h
Generate a skill from git history analysis:
1. Load `skills/skill-from-history/SKILL.md` for full instructions
2. Analyze git commits: `git log --oneline -100`, file change patterns
3. Identify recurring conventions, patterns, practices
4. Generate SKILL.md capturing those patterns
5. Validate with the same `skill-check` command as above

### --improve / -i
Improve an existing skill (instructions only — no eval loop):
1. Read `skills/<name>/SKILL.md`
2. Apply user feedback: rewrite weak sections, tighten body, sharpen description triggering
3. Re-run the same `skill-check` validation command
4. Manual sanity check only — run 1-2 realistic prompts against the skill and review output with the user

## Output

Creates skill at `skills/<name>/SKILL.md`.

$ARGUMENTS
