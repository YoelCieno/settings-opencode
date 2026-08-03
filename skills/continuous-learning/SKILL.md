---
name: continuous-learning
description: Pattern definitions and extraction logic reused by /learn command
version: 1.0.0
scope: opencode
---

# Continuous Learning

This skill provides reusable pattern definitions for the `/learn` command.

## When Used

- `/learn --session` scans conversation for these pattern categories
- `/learn --git` scans commits for these pattern categories
- `bin/patterns.js` exports extraction functions

## Pattern Categories

- **error_resolution**: error, stack trace, exception, fix, failing test, regression
- **user_corrections**: correction, actually, instead, prefer, should be, not this
- **workarounds**: workaround, temporary, fallback, mitigate, unblock, hotfix
- **debugging_techniques**: debug, investigate, log, trace, breakpoint, reproduce
- **project_specific**: convention, guideline, architecture, lint, naming

## Files

- `bin/patterns.js` — reusable pattern definitions and extraction helpers
- `SKILL.md` — this file
