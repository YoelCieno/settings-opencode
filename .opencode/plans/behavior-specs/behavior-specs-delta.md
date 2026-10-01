# Behavior Specs + Delta — General Example (Layer 1)

Layer 1 = plan phase files (phases + major tasks). Layer 2 = opsx change specs (minor/micro tasks, CLI-validated).
This file shows the layer-1 grain only. See `.opencode/plans/conventions.md` for phase-table format.

## Behavior Specs (per phase — every phase file)

## Behavior Specs

### Requirement: Plan Phase Completeness
Every phase file MUST include RFC 2119 requirements with testable scenarios BEFORE `## Tasks`.

#### Scenario: Phase file authored
- GIVEN a new phase file is being created
- WHEN the planner writes the phase
- THEN a `## Behavior Specs` section exists before `## Tasks`
- AND every requirement uses SHALL/MUST/SHOULD/MAY precisely per RFC 2119

## Delta (per phase — only when modifying existing work)

Grain rule: describe WHAT changes at requirement / major-task level. Do NOT paste full
GIVEN/WHEN/THEN bodies here when an opsx change covers the same work — pointer instead.

## Delta

### ADDED Requirements
#### Requirement: Theme-aware toast position
##### Scenario: Toast respects theme (summary only)
- NEW major task: position toast via theme tokens — details in opsx change `add-toast-theming`

### MODIFIED Requirements
#### Requirement: Toast dismiss timeout (MODIFIED from phase-2)
##### Scenario: Timeout reduced to 3s (summary only)
- CHANGED major task: dismiss timeout 5s → 3s — details in opsx change `add-toast-theming`

### REMOVED Requirements
#### Requirement: Legacy manual theme poll
- **Reason:** replaced by signal-based theme detection in phase-3
- **Migration:** none — callers use the new reactive path

## Pointer pattern (when opsx change exists)

When the phase's work has a corresponding opsx change, end the Delta section with:

```
> Full micro-task specs: `openspec/changes/<change-name>/specs/<capability>/spec.md`
```

Never duplicate scenario bodies across both layers.
