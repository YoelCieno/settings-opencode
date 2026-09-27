# phase3-smoke

## Purpose

Smoke-test capability proving the OpenSpec CLI lifecycle completes headless in this repo.

## ADDED Requirements

### Requirement: Lifecycle completes headless

The change SHALL be creatable, validatable, and archivable via headless CLI flags with no interactive prompts.

#### Scenario: full lifecycle

- **GIVEN** an empty changes dir
- **WHEN** `openspec new change`, `openspec validate`, and `openspec archive -y` run in sequence
- **THEN** the change validates clean and lands in the archive with no orphans left in changes/
