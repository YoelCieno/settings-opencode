# Research: simplest skill CREATE/UPDATE workflow (no eval, no benchmark plugin)

Date: 2026-09-29
Scope: SKILL.md creation + updating only. Eval/benchmark tooling explicitly unwanted (KISSME).
Builds on: `.opencode/thoughts/research/2026-09-29-skill-creator-v2-replacements.md` (plugin landscape — not repeated).

## TL;DR

1. **OpenCode has NO built-in skill create/validate/scaffold** — verified CLI, TUI, docs (§1).
2. **`npx skill-check` = single-command spec validator + scaffold**, no account, no eval. Verified running in this repo: 21 rules, exit 0/1, 37ms (§2).
3. **Simplest authoring instructions already in-repo** (`skills/opencode-skill-creator/SKILL.md`, Apache-2.0 Anthropic port) — needs eval sections stripped, not a new port (§3).
4. **DIY floor ≈ 35 LOC** if zero-dep wanted — but skill-check makes DIY redundant (§4).

---

## 1. Built-in: NONE (evidence)

| Surface checked | Evidence | Create/validate/scaffold? |
|---|---|---|
| CLI `opencode --help` | subcommands: completion, acp, mcp, run, debug, providers, agent, upgrade, serve, web, models, stats, export, import, github, pr, session, plugin, db | none skill-related |
| CLI `opencode debug --help` | `opencode debug skill` = **"list all available skills"** (read-only listing; ran it → JSON of name/description/location) | list only, no create/validate |
| TUI slash commands | docs `/docs/tui` built-ins: `/init /undo /redo /share /help /new /models /sessions /compact /clear /export /summarize …` — zero `skill*` command | none |
| Docs `/docs/commands` "Built-in" | "`/init`, `/undo`, `/redo`, `/share`, `/help`" | none |
| Docs `/docs/skills/` (updated 2026-09-28) | authoring = "Create one folder per skill name and put a `SKILL.md` inside it". Rules given: name regex `^[a-z0-9]+(-[a-z0-9]+)*$`, 1–64 chars, dir-name match, description 1–1024 chars, allowed fields `name/description/license/compatibility/metadata`. No scaffold/validate tool mentioned | none |
| Built-in skill `customize-opencode` | `opencode debug skill` → location `<built-in>`; body documents skill format + "Use ONLY when the user is … creating or fixing opencode agents, subagents, skills, plugins" | instructions-only aid, no validator |

⇒ Q1 answer: **zero built-ins**. Best built-in asset = `customize-opencode` skill (auto-injects format rules when authoring) + `/docs/skills/` spec.

## 2. Spec validator: `skill-check` verified working

| Fact | Value (verified 2026-09-29) |
|---|---|
| Package | `skill-check@1.2.0` (npm, published 2026-02-21), bin `skill-check` |
| Repo | `thedaviddias/skill-check`, **189★**, MIT, CI badge, last push **2026-05-18**, 3 open issues, not archived |
| Downloads | **129,455/mo** (api.npmjs.org, 2026-08-29→09-27) — highest of all validator candidates by ~500× |
| Install | `npx -y skill-check …` (also brew tap / curl script) — **no account, no SaaS** |
| Commands | `check`, `new <name>` (scaffold), `rules`, `diff`, `watch`, `report`, `init`, `split-body`, `security-scan` |
| Rules | **21 built-in**: `frontmatter.*` (required, name_required, description_required, name_matches_directory, name_slug_format, name_max_length, field_order, unknown_fields, compatibility_max_length, metadata_string_values, allowed_tools_format), `description.*` (non_empty, max_length, use_when_phrase, min_recommended_length), `body.*` (max_lines, max_tokens), `file.trailing_newline_single`, `links.*` (local_markdown_resolves, references_resolve) |
| **Run in this repo** | `npx -y skill-check check skills --no-security-scan --no-open` → **1 ERROR, 18 warnings, 21 skills, 37ms, exit 1**. Real catch: `skills/tdd-workflow/SKILL.md` has **no frontmatter** (`frontmatter.required`). Warnings = 14× `description.use_when_phrase` (Anthropic-style opinion, NOT OpenCode spec) + 4× trailing newline |
| Single-skill run | `npx -y skill-check check skills/opencode-skill-creator` → PASS, exit 0, 5.4s (incl. security-scan attempt) |
| Broken input | crafted `Bad_Dir/SKILL.md` w/ `name: Wrong_Name` → 4 diagnostics (2 error: `name_matches_directory`, `name_slug_format`; 2 warn: desc too short, no "Use when"), **exit 1** |
| Scaffold | `npx -y skill-check new demo-skill --dir /tmp/opencode/sk-new` → creates `demo-skill/SKILL.md` |
| Exit codes | 0 = pass, 1 = fail (both verified) |
| Gotchas | `check` runs **security scan by default** (uvx → agent-scan/mcp-scan, auto-installs) → always pass `--no-security-scan`; HTML report auto-opens browser → `--no-open`; ASCII banner → `SKILL_CHECK_NO_BANNER=1` |

Runner-up validators (all weaker):

| Package | dl/mo | Signal | Verdict |
|---|---|---|---|
| `@sagargupta1610/skillcheck@0.2.5` | 254 | repo exists, pushed 2026-09-25, "lint + run against **real agent runtimes**" | active but runtime-matrix = heavy |
| `skilltest@0.10.0` | 50 | no `repository` field, 2026-03-23 | lint+**trigger eval** (unwanted), unverifiable |
| `agentic-skill-validator@1.0.4` | 61 | **no repository/homepage fields**, desc = marketing blob | unverifiable → reject |
| `skills` (vercel-labs) | 29,677,770 | 1.7.0 @ 2026-09-17, active | `npx skills init [name]` = **scaffold only, no lint**; installer/manager, not validator |

## 3. Instructions-only resources (create/update workflows)

| Resource | License | Size | Eval content | Port cost |
|---|---|---|---|---|
| **in-repo `skills/opencode-skill-creator/SKILL.md`** (Apache-2.0 anthropics/skills `skill-creator` port, already OpenCode-adapted) | Apache-2.0 | 481 lines | ~60% = eval/benchmark/description-opt (lines ~156–477) referencing **broken plugin tools** | **lowest** — strip eval sections, keep intake-interview + writing guide + install (~200 lines remain) |
| `anthropics/skills` `skill-creator` (178,971★ repo) | Apache-2.0 per-skill `LICENSE.txt` | 485-line SKILL.md + `agents/ eval-viewer/ scripts/ references/` | eval-loop native (Python eval viewer, benchmark aggregation) | medium — it's the *source* of the in-repo copy; no need to re-port |
| `obra/superpowers` `writing-skills` (292,817★) | MIT | 681-line SKILL.md + `anthropic-best-practices.md` (46KB) + subagent test harness | **TDD-for-skills = subagent eval loop** ("If you didn't watch an agent fail without the skill…") | high + violates no-eval constraint |
| Claude Code docs `code.claude.com/docs/en/skills` (upd. 2026-09-28) | docs | ~"Create your first skill" = manual `mkdir` + write frontmatter; frontmatter reference; "Evaluate and iterate → Run evals with skill-creator" | eval section exists | reference only |
| `agentskills.io` spec (`github.com/agentskills/agentskills`) | open spec | spec + quickstart, no validator CLI shipped | n/a | reference only |
| OpenCode `/docs/skills/` | docs | authoritative for THIS runtime (name regex, dir match, 1024 desc, ignored-unknown-fields) | n/a | reference only |

⇒ Q3: **simplest = keep the in-repo port, cut its eval half.** No new port needed.

## 4. DIY floor

What `/skill-plus` modes actually consume (`commands/skill-plus.md`):

- `--create` = `skill_validate` (structure/frontmatter check) + `skill_parse` (name/description/length read) → **both trivial**: parse = agent reads the file itself; validate = skill-check (free) or ~35 LOC script (6 hard rules: frontmatter exists, `name` present, name matches `^[a-z0-9]+(-[a-z0-9]+)*$`, name == dirname, `description` present, description ≤1024).
- `--improve` = `skill_parse` + `skill_eval` + `skill_improve_description` + `skill_optimize_loop` → **all eval** → drop per user. Replacement = instructions: read skill → apply user feedback → re-validate.
- `--from-history` = pure instructions (git log analysis), already plugin-free.

DIY validator ≈ 35 LOC `scripts/validate-skill.mjs` (node, no deps). Justified only under zero-network preference; skill-check supersedes it (21 rules + `--fix` + `new` scaffold).

---

## Options table

| Option | Type | Validates/creates | Install cost | Maintenance signal | Fit KISSME |
|---|---|---|---|---|---|
| **`npx skill-check@1.2.0`** | CLI | validates 21 rules (frontmatter/desc/body/links) + `new` scaffold + `--fix`; exit 0/1 | 0 (npx, no account) | 189★, MIT, CI, 129k dl/mo; code push stale 4 mo (2026-05-18) | **best** |
| In-repo `skills/opencode-skill-creator/SKILL.md` (eval sections stripped) | skill (instructions) | authoring workflow: intake interview → draft → style guide → install | 0 (already present) | locally maintained | **best** (needs 1 edit) |
| OpenCode built-in (`debug skill`, `customize-opencode`, `/docs/skills`) | builtin | list + format rules only; **no create/validate** | 0 | official, updated 2026-09-28 | good as reference, insufficient alone |
| DIY `scripts/validate-skill.mjs` (~35 LOC) | DIY | 6 hard rules only | 0 | yours | good fallback |
| `npx skills init <name>` (vercel-labs) | CLI | scaffold template only, no lint | 0 | 1.7.0 @ 2026-09-17, 29.7M dl/mo | OK — redundant with `skill-check new` |
| `@sagargupta1610/skillcheck` | CLI | lint + conformance **vs real agent runtimes** | 0 | active 2026-09-25, 254 dl/mo, personal pkg | poor (runtime matrix) |
| `skilltest` | CLI | lint + **trigger evals** | 0 | no repo field, stale 2026-03-23 | poor (eval + unverifiable) |
| `agentic-skill-validator` | CLI | frontmatter/structure lint | 0 | **no public repo**, 61 dl/mo | reject |
| Anthropic `skill-creator` (raw) | skill | full create+**eval loop** (Python viewer) | clone/copy | Apache-2.0, 179k★ repo | poor (eval-heavy; superseded by in-repo port) |
| superpowers `writing-skills` | skill | TDD-for-skills w/ **subagent eval harness** | copy | MIT, 293k★ | poor (eval-heavy) |
| V2 shim / fork restoring 14 plugin tools (prior research) | plugin | restores eval tooling | npm dep + 50 LOC | frozen npm / 0★ fork | reject — restores what user rejected |

## Ranked recommendation

**#1 — `skill-check` CLI for validate + in-repo skill (trimmed) for authoring.**

Concrete integration steps (files + LOC):

1. `commands/skill-plus.md` — rewrite mode steps (~15 LOC diff):
   - `--create`: intake → write `skills/<name>/SKILL.md` → validate:
     `npx -y skill-check check skills/<name> --no-security-scan --no-open` (exit 0 = valid). Drop `skill_validate`/`skill_parse` names.
   - `--improve`: **delete** `skill_eval` / `skill_improve_description` / `skill_optimize_loop` steps → "read skill → user feedback → edit → re-run same validation command".
   - `--from-history`: unchanged (already plugin-free).
2. `skills/opencode-skill-creator/SKILL.md` — strip eval/benchmark/description-optimization/plugin-tools sections (test cases, "Running and evaluating", iteration loop, viewer, "Available plugin tools", references to `agents/` + `templates/eval-review.html`): **481 → ~200 lines (≈ −280 LOC)**. Keep: intake interview gate, writing guide, progressive disclosure, install paths.
3. Fix repo's only current ERROR: `skills/tdd-workflow/SKILL.md` has no frontmatter → add `name`+`description` or move out of `skills/` (~5 LOC).
4. Optional hygiene: accept or `--lenient` the 14 `description.use_when_phrase` warnings (Anthropic-style, not OpenCode spec) + 4 trailing-newline warnings (`--fix` handles those).
5. Optional: pin `skill-check@1.2.0` in the npx invocation for determinism. No package.json/plugin/custom-tool changes. **Total ≈ 300 LOC, almost all deletions; zero runtime code.**

Smoke test: `npx -y skill-check check skills --no-security-scan --no-open; echo $?` (expect 0 after step 3).

**#2 — DIY only if npx/network banned:** add `scripts/validate-skill.mjs` (~35 LOC) implementing the 6 OpenCode hard rules from `/docs/skills/`, wire same two command steps. Everything else unchanged.

**#3 — `npx skills init <name>`** as pure template generator if scaffold-with-example wanted; still pair with skill-check for validation (or skip — `skill-check new` already scaffolds).

## Rejected (with reason)

- **OpenCode built-in create/validate/scaffold** — doesn't exist (CLI help, TUI built-ins, `/docs/commands`, `/docs/skills/` all checked §1).
- **`agentic-skill-validator`** — no `repository`/`homepage` npm fields → unverifiable provenance.
- **`skilltest`** — no repo field; lint bundled with trigger evals (unwanted); 50 dl/mo.
- **`@sagargupta1610/skillcheck`** — "run against real agent runtimes" matrix = heavy; 254 dl/mo; single-maintainer pkg.
- **`lazymac-mcp-claude-skill-validator`** — Cloudflare MCP server → external service/infra, not single-command local.
- **superpowers `writing-skills`** — mandates subagent eval loop (TDD-for-skills) → violates no-eval.
- **anthropics `skill-creator` raw port** — eval-native (Python eval-viewer, benchmark aggregation); repo already carries its OpenCode port.
- **V2 shim / git-pinned fork (prior research §4–5)** — restores the 14-tool eval stack user rejected; only needed if eval desire returns.
- **`.opencode/tools/skill_validate.ts` custom tool** — works (docs-verified pattern) but ~60–80 LOC + naming-rule overhead vs `npx` one-liner; permanent drift from spec.
- **DIY validator as primary** — redundant once skill-check chosen (kept as rank-2 fallback only).

## Sources

- https://opencode.ai/docs/skills/ (spec: name regex, dir match, description 1–1024, allowed fields; updated 2026-09-28)
- https://opencode.ai/docs/commands/ (built-in = `/init /undo /redo /share /help`)
- https://opencode.ai/docs/tui/ (full built-in slash-command list — no `skill*`)
- https://opencode.ai/docs/custom-tools/ (custom-tool pattern referenced for DIY alternative)
- Local evidence: `opencode --help`, `opencode debug --help`, `opencode debug skill` (binary 1.18.32 @ `~/.local/share/mise/installs/github-anomalyco-opencode/latest/`)
- https://www.npmjs.com/package/skill-check + https://github.com/thedaviddias/skill-check (`npm view`, GitHub API, `npx skill-check --help|check|rules|new`, runs in this repo 2026-09-29)
- https://api.npmjs.org/downloads/point/last-month/skill-check (129,455) · `/skills` (29,677,770) · `/skilltest` (50) · `/agentic-skill-validator` (61) · `/%40sagargupta1610%2Fskillcheck` (254)
- https://github.com/anthropics/skills (178,971★) · `skills/skill-creator/SKILL.md` + `LICENSE.txt` (Apache-2.0, 485 lines)
- https://github.com/obra/superpowers (`skills/writing-skills/SKILL.md`, 681 lines, MIT)
- https://code.claude.com/docs/en/skills (Claude Code authoring docs, updated 2026-09-28)
- https://agentskills.io/home + https://github.com/agentskills/agentskills (open spec, no official validator CLI)
- https://github.com/vercel-labs/skills (`npx skills init` = scaffold-only; README command table)
- https://www.npmjs.com/package/skilltest · https://www.npmjs.com/package/agentic-skill-validator · https://www.npmjs.com/package/@sagargupta1610/skillcheck (`npm view repository/bin/time` — missing repo fields verified)
- Prior: `.opencode/thoughts/research/2026-09-29-skill-creator-v2-replacements.md`
- Local: `commands/skill-plus.md`, `skills/opencode-skill-creator/SKILL.md`, `skills/tdd-workflow/SKILL.md` (missing frontmatter)
