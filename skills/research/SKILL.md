---
name: research
description: >
  Deep-dive research on a single topic with synthesized conclusions.
  Saves to .opencode/thoughts/research/ for knowledge library. Read-only — no code changes.
---

# Research Skill

Conduct structured multi-source deep-dive investigation. Single mode: **deep dive** (single topic knowledge library entry).

## When to Activate

- User says "research", "investigate", "learn about"
- Needing multi-source evidence before a decision
- Deep-diving a single topic for knowledge library: "how does X work", "learn about Y", "understand Z"
- Building project knowledge base, documentation resources
- Investigating a concept for team documentation

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

## Output to Caller

Return a summary with:
- Topic researched
- Output file path
- Key takeaway (1-2 sentences)

DO NOT write code. Research only.

## Source Citation

**IMPORTANT**: At the end of every response, include `Source/s: <urls/docs>` citing where information came from.
