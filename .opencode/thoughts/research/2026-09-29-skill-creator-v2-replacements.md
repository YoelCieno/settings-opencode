# Research: replacements for broken `opencode-skill-creator` plugin on OpenCode V2

Date: 2026-09-29
Scope: find V2-compatible options for the 14 skill-creation/eval tools lost to the V1→V2 plugin loader break.
Builds on: `.opencode/thoughts/research/2026-09-29-skill-creator-plugin-benchmarks.md` (eval methodology — not repeated here).

## TL;DR

**No published OpenCode V2 plugin provides skill creation/eval/validation tooling.** Verified via npm registry scans, official ecosystem page, GitHub topic scans — no candidates found (details §1). Upstream fix is community-driven, not imminent (§2). Two viable restores: **local V2 shim wrapping the still-published npm 0.2.25** (recommended) and **git-pinned V2 fork branch by sogeisetsu** (zero code, needs audit). Both restore all 14 tools (§3, §4).

---

## 1. Ecosystem scan — result: ZERO V2-compatible skill-creator/eval plugins

| Scan surface | Method | Hits w/ skill create/eval capability |
|---|---|---|
| npm registry | `npm search` × 6 queries (`opencode-plugin`, `opencode skill`, `opencode skill eval`, `skill creator agent`, `skill validate lint`, `sogeisetsu`), inspected dists | only `opencode-skill-creator` itself + 1 fork (V1, rejected §5) |
| Official ecosystem page | full fetch https://opencode.ai/docs/ecosystem/ (updated 2026-09-28) — 39 plugins listed | **0** (skill-adjacent entries are discovery/sidebar/injection: `opencode-skillful`, no eval) |
| GitHub topic `opencode-plugin` | API: 992 total; `topic:opencode-plugin skill` = 68 repos, all listed + inspected | **0** — rest are skill *management* (sidebar, installer, stats, suppression) |
| GitHub `opencode skill eval/creator` | API search, sorted by stars | no V2 OpenCode *plugin*; only standalone CLIs/skills (§6) |

Verification method used throughout: **inspected actual `dist` default exports**, not README claims (per task constraint).

## 2. Upstream status — fix exists only as unmerged fork; not imminent

Repo `antongulin/opencode-skill-creator` (173★, Apache-2.0):

- **npm latest = 0.2.25, published 2026-07-11** — frozen 2.5 months. `dist-tags: {latest: 0.2.25}` only, no prerelease.
- **main HEAD = 2026-07-11** (`fix: isolate skill eval workers (#35)`). No V2 work on main, no V2 branch (branches: `main`, `chore/session-git-sync-rule`).
- **Issue #38** (filed 2026-09-24, OPEN) = the V2 `PluginModule.LoadError` tracking thread. Reproduced on Win11 OpenCode 2.0.15 + macOS Homebrew 2.0.16. Two comments; **upstream author antongulin has not commented**.
- **sogeisetsu** (external contributor "egbert") drives the fix:
  - fork branch `sogeisetsu/opencode-skill-creator#feat/opencode-v2-support`, single commit **2026-09-26**: `feat: migrate plugin to OpenCode V2 plugin API with V1/V2 coexistence`, ~+1088/−231 across 7 source/test files (rest = dist churn, upstream build bug filed as issue #43).
  - **Verified V2**: branch `plugin/dist/skill-creator.js` `builtAt: 2026-09-26T09:44:45`, default export = `{ ...V2Plugin.define({ id: "opencode-skill-creator", async setup(ctx) { ctx.tool.transform(editor => editor.add({ name:"skill_validate", input:{type:"object",…} })) … } }), async server() { …V1 hooks… }`. peerDeps: `@opencode-ai/plugin >=1.18.29` + `@opencode/plugin ^2.0.0`.
  - Has **4 open upstream PRs** (#39–42, all 2026-09-28) — trusted-ish, but **no V2 PR yet**; comment on #38: *"I'll post here as soon as there's a packaged prerelease worth testing."*
  - **No public CI check-runs** visible on the fork branch; 0★ fork.
- Verdict: fix likely within weeks **if** upstream merges (sogeisetsu's other PRs still unreviewed 1+ day; upstream main silent since July). Not reliable timing → need interim option.

## 3. V2 contract verified (authoritative: `@opencode/plugin@2.0.19` type defs)

- `promise/plugin.d.ts`: `Plugin { readonly id: string; readonly setup: (context: Context) => Promise<Cleanup|void> | Cleanup | void }` + `define(plugin)`.
- `promise/tool.d.ts`: `ToolEditor.add({name, input, description, execute})`; `execute: (input, ctx) => Promise<Tool.Result>` → **legacy tools returning bare strings must be wrapped** (`{ content: str }`).
- `@opencode/schema/tool`: `ValueSchema = Schema.Codec | StandardSchemaV1 | JsonSchema` → **zod raw shapes accepted** (Standard Schema); JSON-schema also accepted.
- Legacy bundle facts (npm 0.2.25 `dist/skill-creator.js`, inspected): default export `async (ctx) => ({ tool: { …14× tool(…) } })`; **`ctx` never referenced** (0 matches after fn start); `tool(input) { return input }` = identity; bundled zod **4.1.8**; side effects = `ensureBundledSkillInstalled()` + auto-update check, run inside fn → preserved when fn is called by a shim.

⇒ A thin shim that calls the legacy fn and re-registers the returned tool map via `ctx.tool.transform` is contract-correct. Local proof of pattern: repo `plugins/auto-compact.js` = `import { Plugin } from "@opencode/plugin"; export default Plugin.define({...})` (auto-discovered from `~/.config/opencode/plugins/` = symlink → this repo's `plugins/`).

## 4. Comparison table

| # | Option | V2 compat (how verified) | Coverage vs 14 tools | Maintenance signal | Fit for this repo | Effort |
|---|---|---|---|---|---|---|
| 1 | **Local V2 shim** `plugins/skill-creator-v2-shim.js` wrapping npm `opencode-skill-creator@0.2.25` | ✅ shim authored to verified `@opencode/plugin@2.0.19` types; legacy fn inspected (ctx-free, identity `tool()`, zod4 = StandardSchemaV1) | **14/14** (wraps all registered tools incl. serve/export review; cleanup gap: legacy review-servers not exposed to `Cleanup`) | npm 0.2.25 frozen (deterministic); shim = ~50 LOC in-repo | **best** — matches `plugins/*.js` + `Plugin.define` convention; package.json already has `@opencode/plugin` | ~1–2 h incl. smoke test |
| 2 | **Git-pinned fork** `github:sogeisetsu/opencode-skill-creator#<commit-sha>` | ✅ branch dist inspected: `{...V2Plugin.define({id, setup}), server()}` + V1 coexist; rebuilt 2026-09-26 | **14/14** (full upstream source port + tests) | fork 0★, no CI runs on branch, but author has 4 open upstream PRs; commit-pinnable (docs guarantee full-hash pinning) | good — V2 docs support git specs in `plugin add`; zero repo code | 10 min + 1–2 h diff audit (supply-chain) |
| 3 | **Wait for upstream** (track issue #38) | n/a — currently V1-only, verified broken | 0/14 until shipped | npm frozen 2.5 mo; maintainer silent on #38; community prerelease promised | n/a | $0 now; timing unknown (weeks+) |
| 4 | **V2 custom tools** `.opencode/tools/<name>.ts` (docs verified) | ✅ V2-native (`tool()` helper, `.opencode/tools/` dir) | ≤5/14 practical: `skill_validate`/`skill_parse` easy reimpl; eval/optimize loops need package internals which are bundle-only (no subpath exports) → must import legacy fn anyway = shim with extra steps | duplicate logic vs upstream = permanent drift | OK (docs-native) but naming rule `filename[_export]` → 14 files for exact names | 3–4 h, worse than #1 |
| 5 | **Local SKILL.md manual workflow** (already works; plugin not needed) | n/a | 0/14 as tools; agent hand-runs equivalent validate/parse; no automated `opencode run` trigger-eval loop | zero cost, already maintained (`skills/opencode-skill-creator/`) | fallback | 0 h, capability loss for `/skill-plus` |
| 6 | `agent-skills-eval` (darkrishabh, **798★**, npm 0.1.1 2026-05-07, repo pushed 2026-09-29) | n/a — CLI, not plugin (no plugin loader involved) | ~4/14 equiv: paired with/without benchmark + judge grading + static report; **zero "opencode" mentions in README** → API-driven runner, NOT `opencode run` ⇒ no trigger fidelity | very active | good as *complement* (matches local workspace layout `iteration-N/benchmark.json`) | 0 h (`npx agent-skills-eval`) |
| 7 | `tardigrde/agent-skill-eval` (3★, pushed 2026-07-10) | n/a — CLI | ~2/14: trigger evals driving **real OpenCode CLI** across runs | low stars, medium activity | OK complement for cross-agent | low (`npx`) |
| 8 | `@jeroeng/auror@0.2.0` (npm-only, **no repo/bugs fields**) | n/a — CLI | ~1–2/14: assertion evals (`skillCalled`, `fileTouched`, `commandExecuted`) but README: *"Only `opencode-v1` currently supported"* | unmaintainable signal (no public repo) | poor | low, but V1-runtime-limited |

`/skill-plus` (commands/skill-plus.md) needs exactly 5: `skill_validate`, `skill_parse`, `skill_eval`, `skill_improve_description`, `skill_optimize_loop`.

## 5. Recommended path (ranked)

**Rank 1 — Local V2 shim (option 1).** Rationale: full 14-tool restore; only pinned, integrity-checkable upstream artifact (npm tarball) is executed — no third-party unaudited fork code; ~50 LOC matches existing `plugins/auto-compact.js` convention; trivially revertible when upstream ships V2.

Migration steps:
1. `npm i -D -E opencode-skill-creator@0.2.25` in this repo (exact pin; repo package.json already carries `@opencode/plugin ^2.0.16`, zod, `typecheck` script).
2. Add `plugins/skill-creator-v2-shim.js`:
   ```js
   import { Plugin } from "@opencode/plugin";
   import legacy from "opencode-skill-creator";   // fallback: createRequire(import.meta.url) if bare specifier fails to resolve

   export default Plugin.define({
     id: "opencode-skill-creator.v2-shim",
     async setup(ctx) {
       const { tool: tools } = await legacy();     // legacy fn ignores its ctx arg (verified: 0 `ctx.` refs)
       ctx.tool.transform((editor) => {
         for (const [name, t] of Object.entries(tools)) {
           editor.add({
             name,
             description: t.description,
             input: t.args,                         // zod v4 raw shape = StandardSchemaV1 (accepted by ValueSchema)
             execute: async (input) => ({ content: await t.execute(input) }), // V2 needs Result, legacy returns string
           });
         }
       });
       // known gap: legacy skill_serve_review servers not exposed → no cleanup fn; servers die with process
     },
   });
   ```
3. Remove `"opencode-skill-creator"` from `opencode.jsonc:473` `plugin` array (kills the per-startup LoadError banner; local plugins auto-discover from `plugins/`).
4. Smoke test: start opencode → grep log for `failed to load plugin` (expect none); run `/skill-plus` validate path; tiny `skill_eval` set (2 queries) end-to-end.
5. Track issue #38 → when upstream V2 (or merged sogeisetsu PR) releases: delete shim, restore npm entry, drop dev-dep.

**Rank 2 — Git-pinned fork (option 2).** Zero code, upstream codebase + tests, `opencode plugin add 'github:sogeisetsu/opencode-skill-creator#<full-sha>'`. Prereqs: audit the 7-file diff (+1088/−231) — flips to Rank 1 after audit; pin **full commit hash** (branch may be force-pushed/deleted; no CI evidence on branch).

**Parallel track:** watch #38 for the promised prerelease; sogeisetsu's 4 open PRs = leading indicator of upstream movement.

## 6. Rejected options (with reason)

- **`@fakhrulraharjo/opencode-skill-creator@0.3.0`** — dist inspected: `var SkillCreatorPlugin = async (ctx) => { … return { tool: … } }`, `Plugin.define` count = 0, peerDep `@opencode-ai/plugin >=1.0.0` → **still V1 fn export, same LoadError**. Purpose is oh-my-openagent routing compat, not V2.
- **Any ecosystem/npm plugin** — none exists (§1 scans). `opencode-skill-usage@1.4.0` *is* verified V2 (`export default { id: 'skill-usage', … }` with V1/V2 dual impl) but provides usage tracking, not creation/eval — useful only as a pattern reference.
- **Official CLI path of the package** — `bin/opencode-skill-creator.js --help` = **installer only** (`install --global/--project`, `--version`, `--about`). No eval/validate subcommands ⇒ "just use the CLI" loses `skill_eval`/`skill_optimize_loop` entirely.
- **Reimplement 14 tools as custom tools** — eval loops need `lib/run-eval`, `lib/run-loop`, … which ship only inside the opaque bundle (no subpath exports) ⇒ reimplementation = permanent fork of complex logic; also 14-file naming overhead (§4 #4).
- **`@jeroeng/auror`** — `opencode-v1` provider only, no public repo/issue tracker → dead-end risk; partial coverage anyway.
- **`skill-check@1.2.0`** (lint-only, last 2026-02-21), **`@vibe-agent-toolkit/agent-skills@0.1.42`** (build/validate lib, no bin, no eval loop), **`vercel-labs/skills@1.7.0`** (installer/manager, not evaluator), **`@intentsolutions/jrig-cli@0.2.0`** (7-layer eval but its own Claude-Skills engine, not OpenCode runtime), **`@lythos/skill-creator` / `dsh-skill-creator` / `@tmustier/pi-skill-creator`** (guidance/scaffolding, no eval, non-OpenCode) — each covers a strict subset with different formats.
- **Tiny GitHub eval repos**: `IgorWarzocha/ralph-loop-skill-eval` (5★, stale 2026-01), `guilhermelowa/opencode-skill-eval` (2★, stale 2026-04), `gaoguo/pg-skill-forge` (2★, DB-engine, CN docs, 2026-06) — insufficient maintenance/verification signal.
- **Replacing the eval methodology** — out of scope; benchmarks research (prior doc) concluded the bundled Anthropic-port loop already is community consensus. Shims/forks keep it.

## 7. Risks / open questions for Rank 1

1. Bare-specifier resolution of `opencode-skill-creator` from a local plugin file — fallback `createRequire` or node_modules path; verify in step 4.
2. `t.args` (zod 4.1.8 raw shape) accepted as `input` — backed by `ValueSchema ⊇ StandardSchemaV1`; if loader demands `JsonSchema`, convert with `z.toJSONSchema` (zod already in package.json).
3. Legacy review-server cleanup gap (`skill_serve_review`/`skill_stop_review` process-local map survives plugin teardown) — acceptable; fork PR #41 fixes this upstream.
4. Upstream bundle reshuffle would break shim — snapshot `dist` export shape when pinning (frozen since 2026-07-11).

## Sources

- https://www.npmjs.com/package/opencode-skill-creator (npm registry metadata via `npm view`: versions, time, dist-tags, bin)
- https://github.com/antongulin/opencode-skill-creator (repo stats, commits, releases)
- https://github.com/antongulin/opencode-skill-creator/issues/38 (V2 tracking thread + comments)
- https://github.com/antongulin/opencode-skill-creator/issues/43 (dist build bug)
- https://github.com/sogeisetsu/opencode-skill-creator/tree/feat/opencode-v2-support (V2 fork branch; `plugin/skill-creator.ts`, `dist/build-manifest.json`)
- https://opencode.ai/v2/docs/plugins/ (V2 plugin config: `plugins` key, git specs, commit-hash pinning, `.opencode/plugins/` discovery)
- https://opencode.ai/docs/custom-tools/ (custom tools: `.opencode/tools/`, `tool()` helper, naming rules)
- https://opencode.ai/docs/ecosystem/ (official plugin list, updated 2026-09-28)
- `@opencode/plugin@2.0.19` type definitions (`dist/promise/plugin.d.ts`, `dist/promise/tool.d.ts`, `dist/effect/tool.d.ts`) + `@opencode/schema/dist/tool.d.ts` — V2 `Plugin.define`/`ToolEditor.add`/`ValueSchema` contracts (inspected from installed package)
- `@opencode-ai/plugin@1.18.33` (V1 pkg: zod 4.1.8 dep, `tool()` identity fn in skill-creator bundle)
- https://www.npmjs.com/package/agent-skills-eval · https://github.com/darkrishabh/agent-skills-eval
- https://github.com/tardigrde/agent-skill-eval
- https://www.npmjs.com/package/@jeroeng/auror (README: `provider: opencode-v1` only)
- https://www.npmjs.com/package/skill-check · https://www.npmjs.com/package/vercel-labs/skills (npm `skills`) · https://www.npmjs.com/package/@intentsolutions/jrig-cli · https://www.npmjs.com/package/@vibe-agent-toolkit/agent-skills
- Local: `opencode.jsonc:473` (`plugin` array), `plugins/auto-compact.js` (V2 `Plugin.define` convention), `commands/skill-plus.md`, `skills/opencode-skill-creator/SKILL.md`, `package.json`
