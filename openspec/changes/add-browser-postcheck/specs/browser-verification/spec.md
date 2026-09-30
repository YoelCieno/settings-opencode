# Spec Delta

## Purpose

Verify web UI changes in a real browser after apply/plan execution — console errors, render state, screenshot — from any OpenCode session without installing an MCP server or editing vendored opsx workflow files.

## ADDED Requirements

### Requirement: On-demand browser probe
The system SHALL provide a `/probe <url>` command that opens the given URL in a browser, collects console errors, page title, and a screenshot, and reports results to the user. The probe SHALL work in a headless (TUI/SSH) session with no MCP server and no OpenCode desktop app connected.

#### Scenario: Probe a healthy page
- **WHEN** user runs `/probe https://example.com` and the page loads without console errors
- **THEN** the report shows the page title, "0 console errors", and a screenshot

#### Scenario: Probe a page with console errors
- **WHEN** user runs `/probe <url>` and the page emits console errors
- **THEN** the report lists each error (message + source location) and the command outcome is reported as failed

#### Scenario: Probe with no argument
- **WHEN** user runs `/probe` without a URL
- **THEN** the command asks for a URL instead of guessing one

### Requirement: Postcheck hook in apply workflow
The system SHALL provide an `/apply` command that runs the standard `opsx:apply` workflow unchanged and, after implementation tasks that affect UI, runs the browser probe against the changed route and reports console errors before declaring completion.

#### Scenario: UI-touching change applied
- **WHEN** `/apply` completes tasks that modify UI behavior and a dev server URL is known
- **THEN** the postcheck probe runs on the affected route and console errors are included in the completion report

#### Scenario: Non-UI change applied
- **WHEN** `/apply` completes tasks with no UI impact (config, docs, backend-only)
- **THEN** the postcheck step is skipped and noted as not applicable

#### Scenario: Dev server URL unknown
- **WHEN** postcheck is required but no reachable app URL is known
- **THEN** the report states the probe was skipped and asks the user for the URL instead of failing silently

### Requirement: Vendored opsx references stay untouched
Adding the postcheck SHALL NOT modify any file under `.opencode/references/opsx/`. The postcheck content MUST be composed at command invocation time (command template), so openspec CLI regeneration of opsx references cannot clobber it.

#### Scenario: Regenerate opsx references
- **WHEN** vendored opsx reference files are regenerated or updated by the openspec CLI
- **THEN** `/apply` still includes the postcheck step with no re-application needed

#### Scenario: Stock workflow preserved
- **WHEN** user runs `/opsx:apply` directly
- **THEN** the stock workflow runs with no postcheck injection (opt-in via `/apply`)
