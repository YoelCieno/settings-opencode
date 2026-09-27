---
description: Deep-dive research on a single topic. Saves to .opencode/thoughts/research/.
agent: researcher
subtask: true
---

# Research Command

Conduct deep-dive single-topic investigation for the knowledge library.

## Deep Dive Mode

Single-topic deep investigation for knowledge library. Output to `.opencode/thoughts/research/YYYY-MM-DD-{topic-slug}.md`.

Focus on depth over breadth:
1. Primary Sources (docs, specs, RFCs)
2. Secondary Sources (tutorials, articles)
3. Community Consensus (patterns, pitfalls)
4. Cross-reference with codebase (grep/glob/read)

Output: motivation, core concepts, how it works, key findings, relation to codebase, actionable insights, resources.

## Output to Caller

Return summary with:
- Topic researched
- Output file path
- Key takeaway (1-2 sentences)

DO NOT write code. Research only.

## Source Citation

**CRITICAL**: At the end of every response, include `Source/s: <urls/docs>`.
