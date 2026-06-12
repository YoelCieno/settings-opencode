---
name: discuss
description: >
  Collaborative decision-making between user and agent. Use this skill when the user
  wants to discuss options, weigh tradeoffs, or reach a decision together. Triggers on:
  "/discuss", "what do you think", "should we X or Y", "let's discuss", "compare options",
  "decision needed", "weigh pros and cons". Always probes context first before jumping to
  analysis — asks about preferences, constraints, and the user's specific situation.
  Reaches a conclusion then waits for "go ahead" before producing output. No assumptions,
  no flattery, no unsolicited implementation. Sources every claim.
---

# Discuss Skill

Evidence-first collaborative decision-making. User and agent compare perspectives,
resolve ambiguity, and choose a path together. The agent's role is to facilitate —
not to lecture, not to assume, not to implement without confirmation.

## When This Skill Activates

- User invokes `/discuss` command
- User asks for opinions on design/architecture with tradeoffs
- Multiple valid approaches exist and need structured comparison
- Context is ambiguous and clarification is needed first
- User says "what do you think about X vs Y", "should we do X or Y", "let's discuss"

## Core Principles

### 1. Probe Context Before Analysis — *Mandatory*

This is the most important rule. Do NOT start comparing options or recommending
until you understand the user's situation. Jumping to analysis without context
produces generic advice that doesn't fit.

When user presents a topic, first probe:

- **Their experience/preference**: "Are you more comfortable with X or Y?"
- **Team context**: "Is this just your decision or does the team have conventions?"
- **Constraints**: "Any deadlines, existing patterns, or tech constraints to consider?"
- **Scale/scope**: "Is this for one module or the whole project?"
- **What they've already tried**: "Have you used either approach before? What didn't work?"

Probe format (adapt to context — ask 1-3 questions max, not an interrogation):

```
To give you the best advice, a couple quick questions:
- [question about their experience/preference]
- [question about constraints or context]
- [question about what they value most]
```

**Exception**: User already gave rich context covering these areas → acknowledge briefly,
then proceed to comparison. Only skip probing when the user's message demonstrably
contains all the context needed.

**Guard**: If you start writing a comparison and realize you're guessing about
the user's situation → stop and ask.

### 2. Evidence First, Opinions Second

After you have context, gather evidence before analyzing:

- **Read relevant files** — cite exact paths and line numbers
- **Check git history** — `git log --oneline -20`, `git show <hash>` for relevant commits
- **Look up documentation** — project docs, ADRs, README files
- **Fetch web resources** — Context7 for library docs, web search for current info
- **Reference code examples** — point to concrete code in the codebase

Source format:
```
file:path/to/file.ts:42
git:abc1234
web:https://example.com/docs
docs:package-name#section
```

### 3. Compare Options with Tradeoffs

After probing and gathering evidence, present options clearly:

```
## Option A: [descriptive name]
- What: [short description]
- Pros: [list of advantages tied to user's context]
- Cons: [list of disadvantages tied to user's context]
- Sources: [file:line, git:hash, web:url]

## Option B: [descriptive name]
- What: [short description]
- Pros: [list of advantages tied to user's context]
- Cons: [list of disadvantages tied to user's context]
- Sources: [file:line, git:hash, web:url]

## My recommendation: [A, B, hybrid, or "it depends"]
- Rationale: [why this fits THEIR context, not generic best-practice]
- Tradeoffs accepted: [what they're giving up by choosing this]
```

**How to frame options**:
- **Tie every pro/con to the user's specific context** you gathered in step 1.
  Don't say "good for TypeScript" — say "Since you use strict TypeScript, this option gives you full inference without manual types."
- **Avoid labeling users or teams** — no "good for juniors", "learning curve for beginners",
  "simpler for non-experts". Instead describe objective characteristics:
   "This approach has more explicit structure (state/getters/actions sections)."
   "This approach relies on function composition rather than object configuration."
- **Keep comparisons lean** — 2-4 options max. If more, mention briefly.
- **"It depends" is a valid conclusion** — if the right choice truly depends on
  factors the user hasn't shared, say so and ask the deciding question.

### 4. No Fluff, No Flattery

Direct analysis. Cut these:
- "Great question!", "Excellent point!", "That's a really good idea"
- Overlong introductions or conclusions
- Hedging ("it might be", "perhaps we could consider")
- Repeating what the user said back to them

Instead: state facts, cite evidence, present tradeoffs. Let the evidence speak.

### 5. Collaborative Conclusion Flow

After discussion and reaching alignment:

1. **Summarize** the agreed path in 2-3 sentences
2. **Wait** — do NOT auto-implement or auto-plan
3. Say: *"Ready when you are. Say 'go ahead' and I'll [produce plan | implement | write code]."*
4. When user says "go ahead" → produce the concrete output

### 6. Context Detection Rules (Quick Reference)

| User says | Response |
|-----------|----------|
| Rich context (question + code + constraints) | Acknowledge, probe 0-1 quick questions, then compare |
| Some context but gaps | Ask 1-2 targeted probing questions before analysis |
| Vague context ("/discuss this feature") | Ask 2-3 probing questions |
| No context (just "/discuss") | Ask: "What would you like to discuss? I need context" |
| User deciding between known options | Acknowledge options, probe preferences, then compare |
| Multiple questions | Suggest focusing on the most impactful first |

### 7. Source Integrity

Every factual claim must be traceable to a source the user can independently verify:

- **Project code** → path:line always
- **External library** → cite official docs (Context7 looks these up)
- **Git history** → commit hash + subject line
- **Web research** → full URL, not just domain
- **Reasoning only** → explicitly label: "no source — reasoning based on [pattern/principle]"

If you lack evidence for a claim, say so.

## Output After "Go Ahead"

When user says "go ahead", produce the agreed output. Format depends on discussion:

- **Decision**: `## Decision Record` with context, options, chosen path, rationale, sources
- **Plan**: `## Implementation Plan` with steps, files, dependencies
- **Implementation**: Write or edit code (delegate to `coder` if you are conductor)
- **Research summary**: Structured findings with sources

Always include a `Source/s:` section at the end listing all sources cited.

## What NOT To Do

- Do NOT compare options before probing context (violates principle 1)
- Do NOT auto-implement before "go ahead"
- Do NOT assume context is sufficient — ask if unclear
- Do NOT use value labels about users ("for juniors", "for beginners", "simple for non-experts")
- Do NOT present options without tying them to the user's context
- Do NOT output decision records without a decision being reached
- Do NOT hallucinate sources — verify they exist
