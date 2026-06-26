---
name: skill-from-history
description: >
  Generate skills from git history analysis. Invoked when user says "skill from history",
  "extract patterns", "generate skill". Analyzes commits to identify recurring patterns,
  conventions, and practices, then generates a SKILL.md capturing those patterns.
---

# Skill From History Skill

Analyze git history to generate skill documentation from recurring patterns and conventions.

## When to Activate

- User says "skill from history", "extract patterns", "generate skill from commits"
- Wanting to codify team practices discovered in git history
- Creating a new skill based on observed patterns

## Analysis Process

### Step 1: Gather Commit Data

```bash
# Recent commits
git log --oneline -100

# Commits by file type
git log --name-only --pretty=format: | sort | uniq -c | sort -rn

# Most changed files
git log --pretty=format: --name-only | sort | uniq -c | sort -rn | head -20
```

### Step 2: Identify Patterns

**Commit Message Patterns**:
- Common prefixes and types (feat, fix, refactor)
- Naming conventions
- Scope usage patterns

**Code Patterns**:
- File structure conventions
- Import organization
- Error handling approaches
- State management patterns

**Review Patterns**:
- Common review feedback
- Recurring fix types
- Quality gates

### Step 3: Generate SKILL.md

Create a skill file with:

```markdown
---
name: [skill-name]
description: [What this skill teaches — 1-2 sentences]
---

# [Skill Name]

## Overview
[What this skill teaches]

## Patterns

### Pattern 1: [Name]
- When to use
- Implementation
- Example

### Pattern 2: [Name]
- When to use
- Implementation
- Example

## Best Practices
1. [Practice 1]
2. [Practice 2]

## Common Mistakes
1. [Mistake 1] — How to avoid
2. [Mistake 2] — How to avoid
```

### Step 4: Place the Skill

Write the generated SKILL.md to:
- `/data/sites/ai/settings-opencode/skills/[name]/SKILL.md` (opencode skills repo)
- Create symlink: `ln -s /data/sites/ai/settings-opencode/skills/[name] ~/.qwen/skills/[name]`

---

**TIP**: Focus on patterns that appear 3+ times in history. Single occurrences are noise, not convention.
