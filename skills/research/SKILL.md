---
name: research
description: >
  Structured multi-source research with comparison output. Invoked when user says
  "research", "compare", "investigate", "analyze options". Fetches official docs,
  specs, guides, and best practices for each option. Writes structured comparison
  to .opencode/thoughts/comparisons/. Read-only — no code changes.
---

# Research Skill

Conduct a structured multi-source investigation. Compare options with evidence-based analysis.

## When to Activate

- User says "research", "compare", "investigate", "analyze options"
- Choosing between technologies, libraries, or approaches
- Needing multi-source evidence before a decision
- Evaluating tradeoffs for a design choice

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

## Output to Caller

Return a summary with:
- Topic researched
- Comparison file path
- Winner (recommended option)
- Key takeaway (1-2 sentences)

DO NOT write code. Research only.

## Source Citation

**IMPORTANT**: At the end of every response, include `Source/s: <urls/docs>` citing where information came from.
