# Proposal

## Why

Phase 3 verification needs a real end-to-end smoke test of the OpenSpec CLI lifecycle in this repo. No such change exists yet.

## What Changes

- Add one smoke-test capability `phase3-smoke` with a single SHALL requirement.
- No project code changes (artifacts only).

## Capabilities

### New Capabilities

- `phase3-smoke`: verifies OpenSpec change lifecycle (create → validate → archive) works headless.

### Modified Capabilities

(none)

## Impact

- `openspec/changes/phase3-smoke/` (new, temporary — archived at end of verification).
- No code, config, or docs changes.
