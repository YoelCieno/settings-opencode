# Research: opencode-skill-creator plugin — best benchmarks per community

Date: 2026-09-29
Topic: skill-creator plugin for OpenCode + which skill benchmarks/evals the community considers best

## Motivation

Repo ships `opencode-skill-creator` (skill + plugin) and `/skill-plus` depends on its tools. Question: is its built-in benchmark loop the community consensus, or are there better/standard benchmarks to validate skills against?

Answer in short: the plugin's loop **is** the community-standard *methodology* (ported from Anthropic skill-creator v2). For *external* validation, community converges on **SkillsBench** (research benchmark) + **paired with/without lift metrics** + **trigger/selection evals in CI**.

## Core concepts

1. **Paired lift (delta) methodology** — run each eval twice: `with_skill` vs baseline (`without_skill` / `old_skill`). Core metric = pass-rate **delta**, plus time/token cost. Absolute pass rate alone is meaningless.
2. **Two eval tracks** (community consensus: both required):
   - **Task/output evals** — assertions on produced artifacts, graded w/ evidence.
   - **Trigger/selection evals** — should-trigger vs should-not-trigger queries, weighted toward *near-misses* (confusability grows as skill count grows).
3. **Grading** — deterministic script first where checkable; LLM-judge w/ quoted evidence otherwise; **blind A/B** for version-vs-version (judge doesn't know which is which).
4. **Statistics** — mean ± stddev over N runs; stddev meaningless at 1 run; high stddev = flaky eval or ambiguous skill instructions.
5. **Analyst pass** — hunt non-discriminating assertions (pass in *both* configs → delete/fix test), always-fail assertions (broken eval), token/time outliers.
6. **Human review** — viewer + `feedback.json`; empty feedback = pass.

## How the local plugin implements it

`skills/opencode-skill-creator/` (SKILL.md + `agents/{grader,comparator,analyzer}.md`, `references/schemas.md`, `templates/eval-review.html`) backed by TS plugin in `opencode.jsonc` `plugin: ["opencode-skill-creator", ...]` (line 473-477).

Tools: `skill_validate`, `skill_parse`, `skill_eval`, `skill_improve_description`, `skill_optimize_loop`, `skill_aggregate_benchmark`, `skill_generate_report`, `skill_serve_review`, `skill_stop_review`, `skill_export_static_review`.

Description-optimization loop = 20 queries (8-10 should / 8-10 should-not, near-miss heavy) → 60/40 train/test → 3 reps per query → LLM proposes → re-eval → `best_description` chosen by **test** score (overfit guard).

Provenance: port of Anthropic skill-creator v2 (Mar 2026) → `antongulin/opencode-skill-creator` (npx installer). Same eval workspace layout as agentskills.io spec: `iteration-N/eval-<name>/{with_skill,without_skill}/{outputs,timing.json,grading.json}` + `benchmark.json`.

## Key findings — benchmarks ranked by community

### Tier 1: canonical method (what skill-creator already does)
- Anthropic skill-creator v2 = 4 modes (Create/Eval/Improve/Benchmark), 4 sub-agents (executor, grader, comparator, analyzer). Widely mirrored: `better-skill-creator`, devops-skills fork, agentskills.io spec docs.
- OpenAI Codex team: **10–20 prompts per skill is enough** to catch regressions; classify goals = outcome / process (did it invoke skill & follow steps) / style / efficiency.
- CI practice (stack72/swamp): `tessl skill review` ≥0.90 + trigger-routing pass rate ≥90% gate PRs touching `skills/`; promptfoo trigger evals in CI; weekly regression run per model.

### Tier 2: external research benchmarks
- **SkillsBench** (`benchflow-ai/skillsbench`, ~1.8k★, arXiv 2602.12670, HN 364pts/171 comments) — *the* community reference. 86–87 tasks, 11 domains, deterministic verifiers, paired no-skills/curated/self-generated conditions, 7,308 trajectories.
  - Findings: curated skills **+16.2pp avg** (range +4.5 SWE … +51.9 healthcare; 16/84 tasks *negative* delta); **self-generated skills ≈ 0 benefit**; focused skills (2–3 modules) beat comprehensive docs; small model + skill ≈ big model w/o.
  - HN critique: tasks are single markdown file + opaque verifier — no real codebase/refactor tasks; "self-generated" ≠ reflect-then-write-skill workflow.
- SkillLearnBench (arXiv 2604.20087), SkillGenBench (2605.18693), SkillNet (2603.04448), Tessl framework paper "A Framework for Evaluating Agentic Skills at Scale" (arXiv 2606.17819) — for skill *generation* and *registry-scale* eval.

### Tier 3: runners/harnesses
- **agent-skills-eval** (darkrishabh, ~406★) — agentskills.io spec; automates with/without pairing, judge grading, portable JSON + static HTML; any OpenAI-compatible API.
- **agent-skill-eval** (tardigrde) — runs same CLI a user would, across **OpenCode + Claude Code + Codex**; `benchmark.json` per (agent, config), multi-run (`run-N`), delta interpretation (e.g. +33pp on both agents = strongest signal; ~0 delta → check skill never triggered).
- **Tessl Registry** — 3 eval types: *skill review* (lint, structural/best-practice score), *task evals* (baseline vs with-skill lift), *repo evals* (scenarios from real commit history). Public per-skill scores (ElevenLabs 1.32× success lift, 93–94%). Reruns everything on each model drop.
- eval-skills (termo.ai) — `select`/`report diff`, `--exit-on-fail` for CI gates.

### Community red flags
- **100% vs 100% benchmark = test set too easy** (r/ClaudeAI + Tessl): make cases harder or aim where model actually fails.
- Assertion quality: too easy / too hard / unverifiable → fix next iteration; grade requires concrete evidence, no benefit of the doubt.
- Skills drift after model updates → rerun evals on model change (obsolescence detection: capability skills may become redundant).
- Don't force assertions on subjective skills (style/design) — human review instead.
- Overfitting: generalize from feedback, keep prompt lean, explain the why (avoid MUST/NEVER walls).

## Relation to codebase

- `skills/opencode-skill-creator/SKILL.md` — full loop already matches Tier-1 method; uses paired baselines, timing.json, benchmark delta, trigger evals, blind comparison (agents/comparator.md).
- `/skill-plus` (commands/skill-plus.md) wires plugin tools for create/improve.
- Prior note `.opencode/thoughts/research/2026-08-27-self-improving-opencode-config.md` lists plugin as the skills-only eval/iterate machinery.
- Schema divergence: local `references/schemas.md` requires `grading.json` → `expectations[]` with `text/passed/evidence`; agentskills.io doc sample uses `assertion_results[]`. Field names matter — viewer depends on local names.
- Repo currently has **no** `evals/` set for its own skills → nothing benchmarked.

## Actionable insights

1. Keep skill-creator loop as default; it *is* the consensus. Metrics to watch: pass-rate **delta**, tokens/time delta, stddev across ≥3 runs.
2. Always run both tracks: task evals + trigger evals (near-miss negatives). Trigger quality = biggest real-world failure mode (OpenCode undertriggers).
3. Gate: 2–3 evals first → grow to 10–20; add N-runs only after test set stabilizes; kill non-discriminating assertions.
4. For skill *selection between versions* use blind A/B (comparator) — assertion pass ties hide quality diffs.
5. For cross-agent portability (OpenCode vs Claude Code vs Codex), use `tardigrde/agent-skill-eval`; for external credibility/public score, Tessl-style task evals or SkillsBench-style paired conditions.
6. CI habit: trigger-routing pass-rate gate ≥90% + structural lint ≥0.90 on any `skills/` PR; rerun on model upgrade.
7. If benchmark shows 100%/100% → don't celebrate; harden test cases.

## Resources

- https://github.com/anthropics/skills/tree/main/skills/skill-creator (upstream)
- https://github.com/antongulin/opencode-skill-creator (OpenCode port + plugin)
- https://agentskills.io/skill-creation/evaluating-skills (spec-level eval guide, workspace layout)
- https://github.com/benchflow-ai/skillsbench · https://arxiv.org/abs/2602.12670 · https://skillsbench.ai · https://news.ycombinator.com/item?id=47040430
- https://tessl.io/blog/anthropic-brings-evals-to-skill-creator-heres-why-thats-a-big-deal
- https://tessl.io/blog/three-context-eval-methodologies · https://tessl.io/blog/introducing-task-evals-measure-whether-your-skills-actually-work
- https://arxiv.org/html/2606.17819 (Tessl: Framework for Evaluating Agentic Skills at Scale)
- https://github.com/darkrishabh/agent-skills-eval · https://github.com/tardigrde/agent-skill-eval
- https://developers.openai.com/blog/eval-skills (Codex skill evals, 10–20 prompts)
- https://stack72.dev/skills-are-context-and-context-needs-tests (CI gates)
- https://blog.multiagentai.co/cc/agent-skills-best-practice (selection/confusability evals)
- https://www.anton.qa/blog/posts/how-to-create-custom-opencode-skills-step-by-step-guide
- Local: `skills/opencode-skill-creator/SKILL.md`, `commands/skill-plus.md`, `opencode.jsonc:473`
