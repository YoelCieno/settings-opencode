---
name: update-docs
description: >
  Update documentation to reflect recent code changes. Detects drift across last 5
  commits, syncs active plans with code, delegates codemaps to update-codemaps.
  Provides executable procedure (categorize → act → verify). Invoked when user says
  "update docs", "sync docs", "document changes".
---

# Update Docs Skill

Update documentation to reflect recent code changes.

## When to Activate

- User says "update docs", "sync docs", "document changes"
- After a significant feature implementation
- After renaming files, packages, or restructuring directories
- After changing APIs, exports, or configuration
- As final step before PR/commit submission

## Process (executable)

### 1. Drift Detection

Run all scans before writing anything:

**a) Last 5 commits scan:**
```bash
git log --oneline -5 --name-only --format="COMMIT: %h %s"
```
Parse output: for each file changed, note the OLD name (for renames) and NEW name.
Check each changed file against corresponding doc sections.

**b) Cross-reference:**
```
For each .ts/.tsx with new/changed exports:
  grep "export" <file> → extract exported symbols
  grep "<symbol>" docs/*.md → check if documented
For each renamed file:
  grep "<old-name>" docs/*.md → find stale references
For each deleted file:
  grep "<deleted-name>" docs/*.md → find dead links
```

### 2. Plan Sync (MANDATORY — always run)

Before updating any doc, you MUST determine if there is an active plan being executed.

**Step 1 — Search for documented plans:**
- Check `.opencode/plans/` for `.md` files
- Check `AGENTS.md` for in-progress sections
- Check `README.md` for plan/progress section
- Check any file with "plan" in its name at repo root

**Step 2 — If no documented plan found, ASK the user:**
```
Are you executing a plan for this work?
A) Yes — documented plan at: <path>
B) Yes — short-plan in session (not a file)
C) No — no plan, just update docs
```

**Step 3 — Sync the plan:**
- Compare plan's described changes against actual code in the diff
- Update plan to match REAL code state (not aspirations)
- Remove completed items
- Add unplanned changes found in drift detection (step 1)
- If short-plan: ask user "Want me to formalize this as a plan file in `.opencode/plans/`?"

**Critical:** Never silently skip plan sync. If you cannot determine plan status, you MUST ask.

### 3. Categorize Changes

| Category | Action |
|----------|--------|
| NEW export/file/config | Add to TOC + create doc section + write example |
| RENAMED file/symbol | grep+replace old name in all .md files + update TOC |
| REMOVED export/file | Delete doc section + remove from TOC + fix examples |
| API CHANGED | Update params table + rewrite examples + update JSDoc + migration note if breaking |

### 4. Update Documentation

**NEW:**
- Add to Table of Contents
- Write doc section following existing style
- Include working example
- Add to navigation/overview files

**RENAMED:**
- `grep -rn "<old-name>" docs/` — update all matches
- Update directory path references
- Verify links still work

**REMOVED:**
- Delete entire doc section
- Remove from TOC
- Update examples that used removed API
- Check cross-references

**API CHANGED:**
- Update function signature
- Update param table (add/remove, change types, mark optional)
- Rewrite examples
- Add migration note if breaking change

### 5. Delegate Codemaps

Do NOT generate codemaps inline. Delegate to update-codemaps workflow:
```
task(description="Update codemaps", subagent_type="doc-updater")
```
Prompt: "Run the update-codemaps command to refresh architecture, module, and file maps in docs/CODEMAPS/"

Keeps codemap generation single-sourced in commands/update-codemaps.md.

### 6. Verify

After all updates:
```bash
# Confirm doc files were modified
git diff --stat | grep "\.md"

# No stale references to old names
for old_name in <renamed-items>; do
  if grep -r "$old_name" docs/*.md > /dev/null 2>&1; then
    echo "STALE: $old_name still referenced in docs"
  fi
done

# Check TOC entries exist as headings (spot-check README.md)

# Check for broken links
grep -rn "\[.*\](.*)" docs/*.md | grep -v "http" | while read -r line; do
  target=$(echo "$line" | grep -oP '\]\(\K[^)]+')
  if [ -n "$target" ] && [ ! -f "$target" ]; then
    echo "BROKEN LINK: $target"
  fi
done 2>/dev/null || true
```

## Documentation Types

### README.md
- Installation instructions
- Quick start guide
- Feature overview
- Configuration options
- Table of Contents (must match headings)

### AGENTS.md (Project-Specific)
- Package layout and architecture direction
- Commands table (must match actual commands/)
- Key config details
- Gotchas & quirks

### API / Package Documentation
- Export maps in package.json (verify against filesystem)
- JSDoc for public APIs
- Interface descriptions
- Example code (test that imports work)

### Code Comments
- JSDoc for public APIs
- Complex logic explanations (only when why is not obvious from naming)
- TODO/FIXME cleanup (remove now-redundant TODOs)

## Update Checklist

- [ ] README reflects current features and structure
- [ ] AGENTS.md matches current project state
- [ ] Package exports match filesystem
- [ ] JSDoc updated for changed functions
- [ ] Examples compile/import correctly
- [ ] Links are valid
- [ ] Version numbers updated (if applicable)
- [ ] Active plan synced with real code state
- [ ] Plan sync asked user if uncertain
- [ ] Codemaps updated (via delegation)

## Documentation Quality

### Good Documentation
- Accurate and up-to-date
- Clear and concise
- Has working examples
- Covers edge cases

### Avoid
- Outdated information
- Missing parameters
- Broken examples
- Ambiguous language
- Stale references to renamed/deleted items

---

**IMPORTANT**: Documentation should be updated alongside code changes, not as an afterthought. Run drift detection first — never guess what changed. ALWAYS check for active plan and sync it. If unsure about plan status, ASK.
