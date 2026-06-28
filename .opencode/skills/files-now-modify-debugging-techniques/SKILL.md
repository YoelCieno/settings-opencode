---
name: files-now-modify-debugging-techniques
description: Use this pattern when handling recurring debugging techniques workflows.
title: Structured Debugging Pattern
signature: 30a980c40edf
version: 1.0.0
source: continuous-learning
category: debugging_techniques
status: review-required
session_id: ses_14465ac17ffeBgJ3oaQ5DKLrpG
message_count: 24
tags: [debugging, analysis]
---

# Structured Debugging Pattern

## When to use
Use this pattern when handling recurring debugging techniques workflows.

## Steps
1. Form one hypothesis at a time from observable symptoms.
2. Instrument selectively (logs, runtime values, targeted reads).
3. Narrow scope until one causative change is identified.
4. Validate fix with focused and then broader checks.

## Examples
- ### 7. Verify
- assistant: Now inspect all files to modify.

## Caveats
- Avoid noisy instrumentation that obscures signal.
- Prefer deterministic repro over probabilistic assumptions.
