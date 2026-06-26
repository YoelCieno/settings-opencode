---
description: Update documentation for recent changes. Scans last 5 commits, syncs active plans, delegates codemaps.
agent: doc-updater
subtask: true
---

# Update Docs Command

Update documentation to reflect recent changes: $ARGUMENTS

## Your Task

### 1. Drift Detection

**a) Last 5 commits:**
```
git log --oneline -5 --name-only --format="COMMIT: %h %s"
```
For each changed file: check corresponding doc sections for staleness.

**b) Cross-reference:**
- New/changed exports → check if documented
- Renamed files → grep old name in docs
- Deleted files → grep for dead references

### 2. Plan Sync (MANDATORY — always run)

**Step 1** — Search for documented plans:
- `.opencode/plans/` for `.md` files
- `AGENTS.md` / `README.md` for in-progress sections
- Any file with "plan" in its name

**Step 2** — If no documented plan found, ASK the user:
```
Are you executing a plan for this work?
A) Yes — documented plan at: <path>
B) Yes — short-plan in session (not a file)
C) No — no plan, just update docs
```

**Step 3** — Sync the plan:
- Compare plan's described changes vs actual code
- Update plan to match real code state
- Remove completed items, add unplanned changes
- If short-plan: ask if user wants to formalize as `.opencode/plans/`

**Never silently skip.** If unsure about plan status, ask the user.

### 3. Categorize Changes

| Change | Action |
|--------|--------|
| NEW | Add to TOC + doc section + example |
| RENAMED | grep+replace old name in .md files + update TOC |
| REMOVED | Delete section + remove from TOC + fix examples |
| API CHANGED | Update params + rewrite examples + update JSDoc |

### 4. Update Documentation

- Follow existing doc style
- Update README.md, AGENTS.md, API docs as needed
- Update code comments / JSDoc for changed functions
- Remove now-redundant TODOs/FIXMEs

### 5. Update Codemaps

Delegate to update-codemaps (do not duplicate instructions):
```
task(description="Update codemaps", subagent_type="doc-updater")
```
Prompt: "Run the update-codemaps command to refresh docs/CODEMAPS/"

### 6. Verify

- `git diff --stat | grep "\.md"` — confirm doc changes
- grep for stale old names in docs
- Check TOC entries exist as headings
- Check for broken links

## Documentation Types

### README.md
- Installation, quick start, feature overview, config options
- Table of Contents must match headings

### AGENTS.md
- Package layout, commands table, config details, gotchas

### API Documentation
- Export maps, JSDoc, interfaces, examples

### Code Comments
- JSDoc for public APIs, complex logic explanations, TODO/FIXME cleanup

## Update Checklist

- [ ] README reflects current features
- [ ] AGENTS.md matches current state
- [ ] Package exports match filesystem
- [ ] JSDoc updated for changed functions
- [ ] Examples compile/import correctly
- [ ] Links are valid
- [ ] Version numbers updated
- [ ] Active plan synced with code
- [ ] User asked if plan status uncertain
- [ ] Codemaps updated (via delegation)

---

**IMPORTANT**: Run drift detection first. ALWAYS check for active plan. Ask if unsure.
