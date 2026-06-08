---
description: Create small implementation plan (single phase)
agent: planner
subtask: true
---
# Small Plan Command

Create a small implementation plan for: $ARGUMENTS

## Your Task

1. **Restate Requirements** - Clarify what needs to be built
2. **Identify Risks** - Surface potential issues, blockers, and dependencies
3. **Create Step Plan** - Break down implementation into steps (single phase)
4. **Wait for Confirmation** - MUST receive user approval before proceeding

## Output Format

### Requirements Restatement

[Clear, concise restatement of what will be built]

### Implementation Steps

- Step 1
- Step 2
  ...

### Dependencies

[List external dependencies, APIs, services needed]

### Risks

- HIGH: [Critical risks that could block implementation]
- MEDIUM: [Moderate risks to address]
- LOW: [Minor concerns]

### Estimated Complexity

[ HIGH/MEDIUM/LOW with time estimates]

### Persistent Plan Files

When approved, save plan files via `writer` subagent:
- Task `writer` to create `.opencode/small-plans/<plan-name>/README.md` (plan details)

You lack write/edit — use Task to delegate file creation to `writer`.

Templates at `.opencode/small-plans/templates/`. Plans are git-committed for shared context.

**WAITING FOR CONFIRMATION**: Proceed with this plan? (yes/no/modify)

---

**CRITICAL**: Do NOT write any code until the user explicitly confirms with "yes", "proceed", or similar affirmative response.
