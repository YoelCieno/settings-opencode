---
description: Structured multi-source research with comparison output
agent: researcher
subtask: true
---

# Research Command

Conduct a structured multi-source investigation of: $ARGUMENTS

## Methodology

For each major option or technology being researched:

1. **Official Docs** — Fetch primary documentation
2. **Spec/Source** — Fetch specification, RFC, or source README
3. **Cookbook/Guide** — Fetch a practical guide or tutorial
4. **Best Practices** — Fetch community best practices guide

## Required Output

Write a structured comparison to `.opencode/thoughts/comparisons/YYYY-MM-DD-{topic-slug}.md` with:

- Research question
- Options considered
- Resource analysis per option (all 4 source types)
- Conflicts between sources
- Comparison table (setup, API, perf, ecosystem, security, license, integration effort)
- Clear recommendation with evidence-based justification
- Open questions

## Output format

Return a summary to the caller with:
- Topic researched
- Comparison file path
- Winner (recommended option)
- Key takeaway (1-2 sentences)

DO NOT write code. Research only.

## Source Citation

**IMPORTANT**: At the end of EVERY response, include `Source/s: <urls/docs>` citing where information came from.
