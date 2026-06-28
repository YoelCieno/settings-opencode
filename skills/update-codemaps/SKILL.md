---
name: update-codemaps
description: >
  Update codemaps for codebase navigation. Invoked when user says "update codemaps",
  "generate codemaps", "codemap". Creates or updates architecture, module, and file
  maps in docs/CODEMAPS/ to reflect current codebase structure.
---

# Update Codemaps Skill

Update codemaps to reflect current codebase structure.

## When to Activate

- User says "update codemaps", "generate codemaps", "codemap"
- After adding new modules or significant refactoring
- After restructuring the package layout

## Process

1. **Analyze codebase structure** — scan directories, imports, exports
2. **Generate component maps** — architecture, modules, files
3. **Document relationships** — dependencies, data flow
4. **Update navigation guides** — keep `docs/CODEMAPS/` in sync

## Codemap Types

### Architecture Map — `docs/CODEMAPS/ARCHITECTURE.md`
- High-level system overview
- Component relationships
- Data flow diagrams

### Module Map — `docs/CODEMAPS/MODULES.md`
- Module descriptions
- Public APIs
- Dependencies

### File Map — `docs/CODEMAPS/FILES.md`
- Directory structure
- File purposes
- Key files

## Codemap Format

### [Module Name]

**Purpose**: [Brief description]

**Location**: `src/[path]/`

**Key Files**:
- `file1.ts` — [purpose]
- `file2.ts` — [purpose]

**Dependencies**:
- [Module A]
- [Module B]

**Exports**:
- `functionName()` — [description]
- `ClassName` — [description]

**Usage Example**:
```typescript
import { functionName } from '@/module'
```

## Generation Process

1. Scan directory structure — `glob` for relevant patterns
2. Parse imports/exports — `grep_search` for export/import patterns
3. Build dependency graph — trace inter-package imports (`@repo/*`)
4. Generate markdown maps — write to `docs/CODEMAPS/` directory
5. Validate links — verify referenced paths exist

---

**TIP**: Keep codemaps updated when adding new modules or significant refactoring.
