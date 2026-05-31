# Plan Conventions

## Structure

```
.opencode/plans/
├── README.md              # Index of all plans
├── conventions.md          # This file
├── templates/              # Templates for new plans
│   ├── plan-README.md
│   └── phase-N.md
└── <plan-name>/            # One dir per plan
    ├── README.md           # Entry point w/ phase table
    ├── phase-0.md          # Phase files
    ├── phase-1.md
    └── phase-N/
        └── <topic>.md      # Sub-docs for complex phases
```

## Phase Status Emojis

| Status | Emoji |
|--------|-------|
| COMPLETED | ✅ |
| IN PROGRESS | 🔧 |
| PENDING | ❌ |

## Required Sections Per Phase

- **Goal** — 2-3 sentence description of what phase achieves
- **Tasks** — checklist items (`- [ ]`)
- **Decisions** — table: #, Decision, Choice, Rationale
- **Notes** — learnings, gotchas, future considerations

## Optional Sections

- **Key Constraints** — hard rules or boundaries
- **Research Required** — topics needing investigation before impl
- **Reference Docs** — links to relevant docs

## Rules

1. **Plans are committed.** Persistent context shared across sessions. Not transient scratch.
2. **Decision tables prevent re-debate.** Once choice made, log it. Do not re-open unless new evidence.
3. **Research before implementation.** Investigate options first. Artifacts in `.opencode/thoughts/comparisons/`.
4. **Status updated as work progresses.** Not batch-updated at end. Each phase updated when entered/completed.
5. **Complex phases get sub-docs.** If a phase has many decisions or subtopics, create `phase-N/<topic>.md`.

## Workflow

1. `planner` agent creates plan skeleton via `/plan`
2. Phases filled iteratively as work advances
3. Each phase README links to its phase-N.md
4. Phase status reflects current state in real time
