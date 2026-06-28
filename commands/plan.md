---
description: Create, track, and continue implementation plans with subcommands (status, continue). Usage: /plan status, /plan continue &lt;name&gt;, /plan $ARGUMENTS
agent: planner
subtask: true
---

# Plan Command

## Subcommand Routing

Check first word of `$ARGUMENTS`:

### `/plan status`
1. List `.opencode/plans/` subdirectories (exclude `templates/`, `README.md`, `conventions.md`)
2. For each plan dir, read `README.md` → parse phase table → find 🔧 or ❌ phases
3. Output table: Plan Name | Overall Status | Current Phase
4. Ask user: "Continue plan [NAME]?" / "Update docs?" / "No unfinished plans"
5. On "continue" selection → load plan, review, ask next action

### `/plan continue <name>`
1. Read `.opencode/plans/<name>/README.md`
2. Find first phase with 🔧 IN PROGRESS or ❌ PENDING
3. Load phase file (e.g., `phase-1.md`)
4. Summarize: goal, completed tasks, remaining tasks
5. Ask: "Proceed with phase N?"

### Default (no subcommand match) — Create new plan

Reference plan conventions from `.opencode/plans/conventions.md` for phase table format.

Create a detailed implementation plan for: $ARGUMENTS

## Your Task

1. **Restate Requirements** - Clarify what needs to be built
2. **Identify Risks** - Surface potential issues, blockers, and dependencies
3. **Create Step Plan** - Break down implementation into phases
4. **Wait for Confirmation** - MUST receive user approval before proceeding

## Output Format

### Requirements Restatement

[Clear, concise restatement of what will be built]

### Implementation Phases

[Phase 1: Description]

- Step 1.1
- Step 1.2
  ...

[Phase 2: Description]

- Step 2.1
- Step 2.2
  ...

### Dependencies

[List external dependencies, APIs, services needed]

### Risks

- HIGH: [Critical risks that could block implementation]
- MEDIUM: [Moderate risks to address]
- LOW: [Minor concerns]

### Estimated Complexity

+[HIGH/MEDIUM/LOW with time estimates]

### Persistent Plan Files

When approved, save plan files via `writer` subagent:
- Task `writer` to create `.opencode/plans/<plan-name>/README.md` (phase table)
- Task `writer` to create `.opencode/plans/<plan-name>/phase-N.md` (per phase)

You lack write/edit — use Task to delegate file creation to `writer`.

Templates at `.opencode/plans/templates/`. Plans are git-committed for shared context.

### Source Citation

At the end of your response, include `Source/s: <urls/docs>` citing where project info and architecture decisions came from.

**WAITING FOR CONFIRMATION**: Proceed with this plan? (yes/no/modify)

---

**CRITICAL**: Do NOT write any code until the user explicitly confirms with "yes", "proceed", or similar affirmative response.
