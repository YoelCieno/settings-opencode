---
name: research
description: >
  Multi-mode research: compare technologies/options with structured comparison,
  or deep-dive single topics with synthesized conclusions. Auto-detects mode;
  --compare/--deep override. Saves to .opencode/thoughts/comparisons/
  or .opencode/thoughts/research/ for knowledge library. Read-only — no code changes.
---

# Research Skill

Conduct structured multi-source investigation. Two modes: **comparison** (compare options) or **deep dive** (single topic knowledge library entry). Auto-detects mode from query.

## When to Activate

- User says "research", "compare", "investigate", "analyze options"
- Choosing between technologies, libraries, or approaches
- Needing multi-source evidence before a decision
- Evaluating tradeoffs for a design choice
- Deep-diving a single topic for knowledge library: "how does X work", "learn about Y", "understand Z"
- Building project knowledge base, documentation resources
- Investigating a concept for team documentation

## Mode Detection

Auto-detect based on query:
- **Comparison mode**: query mentions multiple options, "vs", "compare", "alternatives", "X or Y"
- **Deep dive mode**: single topic, "how does X work", "learn about Y", "explain Z", "architecture of"

Override with flags: --compare or --deep as first argument.

## Comparison Mode Methodology

For each major option or technology being researched:

1. **Official Docs** — Fetch primary documentation
2. **Spec/Source** — Fetch specification, RFC, or source README
3. **Cookbook/Guide** — Fetch a practical guide or tutorial
4. **Best Practices** — Fetch community best practices guide

### Comparison Output

Write a structured comparison to `.opencode/thoughts/comparisons/YYYY-MM-DD-{topic-slug}.md` with:

- Research question
- Options considered
- Resource analysis per option (all 4 source types)
- Conflicts between sources
- Comparison table (setup, API, perf, ecosystem, security, license, integration effort)
- Clear recommendation with evidence-based justification
- Open questions

## Deep Dive Mode Methodology

Investigate a single topic thoroughly to build project knowledge. Focus on depth over breadth:

1. **Primary Sources** — Official docs, specs, RFCs, source code
2. **Secondary Sources** — Tutorials, guides, articles, videos
3. **Community Consensus** — Best practices, common patterns, pitfalls
4. **Your Codebase Context** — How does this relate to existing code? Use grep/glob/read to find relevant existing usage.

### Deep Dive Output

Write a structured knowledge entry to `.opencode/thoughts/research/YYYY-MM-DD-{topic-slug}.md` with:

- **Topic**: What was researched
- **Motivation**: Why this research was needed
- **Core Concepts**: Key definitions, principles, mental models
- **How It Works**: Detailed explanation with diagrams/text
- **Key Findings**: Synthesized conclusions from sources
- **Relation to Our Codebase**: How this applies to current project (search codebase for relevant code)
- **Resources**: All URLs cited

## Output to Caller (both modes)

Return a summary with:
- Topic researched
- Output file path
- Mode used (comparison or deep dive)
- Key takeaway (1-2 sentences)

DO NOT write code. Research only.

## Source Citation

**IMPORTANT**: At the end of every response, include `Source/s: <urls/docs>` citing where information came from.
