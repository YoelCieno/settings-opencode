---
description: Multi-mode research: compare options or deep-dive single topics. Auto-detects mode; --compare/--deep override. Saves to .opencode/thoughts/comparisons/ or .opencode/thoughts/research/.
agent: researcher
subtask: true
---

# Research Command

Conduct multi-mode research. Auto-detects comparison vs deep dive mode from query syntax.

## Mode Detection

Parse $ARGUMENTS to determine mode:

- **Explicit flag**: --compare or --deep as first arg → force that mode, strip the flag before processing
- **Auto-detect** (no flag):
  - Query mentions multiple options: "vs", "compare", "alternatives", "X or Y", "pros and cons", "tradeoffs" → **Comparison Mode**
  - Single topic query: "how does X work", "learn about Y", "explain Z", "architecture of", "overview" → **Deep Dive Mode**

## Comparison Mode

Structured multi-source investigation comparing options. Output to `.opencode/thoughts/comparisons/YYYY-MM-DD-{topic-slug}.md`.

For each option:
1. Official Docs
2. Spec/Source
3. Cookbook/Guide
4. Best Practices

Output: research question, options, resource analysis, conflicts, comparison table, recommendation, open questions.

## Deep Dive Mode

Single-topic deep investigation for knowledge library. Output to `.opencode/thoughts/research/YYYY-MM-DD-{topic-slug}.md`.

Focus on depth over breadth:
1. Primary Sources (docs, specs, RFCs)
2. Secondary Sources (tutorials, articles)
3. Community Consensus (patterns, pitfalls)
4. Cross-reference with codebase (grep/glob/read)

Output: motivation, core concepts, how it works, key findings, relation to codebase, actionable insights, resources.

## Output to Caller (both modes)

Return summary with:
- Topic researched
- Output file path
- Mode used
- Key takeaway (1-2 sentences)

DO NOT write code. Research only.

## Source Citation

**CRITICAL**: At the end of every response, include `Source/s: <urls/docs>`.
