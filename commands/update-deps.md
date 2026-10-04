---
description: Safe dependency updates — worktree, one dep at a time, full layer verification, stop-and-report on fail
---

# /update-deps — Dependency Update Flow

Update dependencies one by one, verify every layer after each update, stop on first failure.

$ARGUMENTS (optional: target dep name(s), `--quick`, or `--major`)

## Principles

1. **One dep at a time** — each update individually verified, bisectable failures.
2. **Never touch the current checkout** — all work in a dedicated worktree.
3. **Stop on first fail** — report verbatim, keep worktree, triage with user.
4. **Ask before commit** — green run ≠ auto-commit. User confirms.
5. **Token-frugal security notes** — Dependabot check runs ONLY at checkpoints (below), never proactively per session.

## Step 0 — Preflight (checkpoint: security note)

1. **Detect package manager** (priority order):
   - `package.json` → `packageManager` field (e.g. `bun@1.3.13`)
   - lockfile glob: `bun.lock*` → bun | `pnpm-lock.yaml` → pnpm | `yarn.lock` → yarn | `package-lock.json` → npm
   - fallback: `bun`
   - Multiple/contradictory lockfiles → **report drift, stop, ask** (e.g. bun.lock + package-lock.json together).
2. **PM command map** — bun path is verified; others = best-effort, confirm with user before running:

   | PM | list | update in-range | update latest |
   |---|---|---|---|
   | bun | `bun outdated` | `bun update <pkg>` | `bun update <pkg> --latest` |
   | pnpm | `pnpm outdated` | `pnpm update <pkg>` | `pnpm update <pkg> --latest` |
   | yarn | `yarn outdated` | `yarn up <pkg>` | `yarn up <pkg>@latest` |
   | npm | `npm outdated` | `npm install <pkg>` | `npm install <pkg>@latest` |

3. **Dependabot checkpoint** (silent token cost ≈ 1 call):
   ```bash
   gh api repos/<owner>/<repo>/dependabot/alerts \
     --jq '[.[] | select(.state=="open")] | map({num: .number, sev: .security_advisory.severity, pkg: .dependency.package.name, patched: .security_advisory.vulnerabilities[0].first_patched_version.identifier})'
   ```
   Open alerts → emit note:
   > ⚠️ Security note (non-blocking): GitHub Dependabot reports N vulns on default branch — <severities>. Review: <repo url>/security/dependabot
   No gh auth / not a GitHub repo → skip silently.

## Step 1 — Scope

1. Run PM `list outdated`.
2. Show table: dep | current | wanted | latest.
3. User confirms targets (default = in-range patches + minors; majors excluded unless `--major`). Display sorted by band: patches first, minors after, majors last.

## Step 2 — Worktree

1. Branch: `chore/deps-<YYYYMMDD>` (convention: `<type>/<scope>-<desc>`).
2. `git worktree add <path> -b chore/deps-<YYYYMMDD>` — path outside main checkout (e.g. sibling `../<repo>-wt/deps-<YYYYMMDD>`).
3. Fresh install in worktree (worktrees have NO node_modules): `<pm> install` from worktree cwd.
4. Verify clean baseline: run layers once BEFORE any update → baseline green required. Baseline red → stop, report (pre-existing breakage, not deps).

## Step 3 — Loop (one dep at a time)

**Order: patch → minor → major** (semver ascending — smallest blast radius first; a patch failure = trivially bisectable). Sort targets into 3 bands, exhaust band before next. Majors = Step 4 only.

For each confirmed dep, from worktree cwd:

1. **Update in-range**: `<pm> update <pkg>` → Step 3a layers.
2. All pass → commit? NO — accumulate, ask at Step 4. Next dep.
3. FAIL → Step 3c triage.

### Step 3a — Layer verification

Detect layers from `package.json` scripts (run only what exists):

| Layer | Script | Order |
|---|---|---|
| typecheck | `typecheck` or `tsc --noEmit` | 1 |
| lint | `lint` | 2 |
| test | `test` | 3 |
| build | `build` | 4 |

**Weight — shared-dep aware:**
- dep declared in **workspaces** (`packages/*`, `apps/*`) → **full pass** (typecheck+lint+test+build). Shared dep breakage = cross-package blast radius.
- dep **root-only / leaf** → **quick pass** (typecheck+test) unless `--full`.
- `--quick` flag → typecheck+test only, all deps (fast path; build re-verified once at end).

Sequential per dep (predictable, bisectable). Parallel = later optimization.

### Step 3b — Frontend probe (only if frontend detected)

Detection: `dev` script + (`vue`|`angular`|`react` dep or framework dir under `apps/*`).

1. Start dev server from **worktree cwd** (background): `<pm> run dev`.
2. Wait for port/ready (bounded wait ~30s, no blind retry).
3. Probe base route: `bun ~/.config/opencode/scripts/probe.ts <base-url>` (outside this repo: abs path above; local: `bun scripts/probe.ts <url>`).
4. Extra routes: probe known router paths (from router config) — skip if none discoverable.
5. Kill dev server after probe — always, pass or fail.

### Step 3c — FAIL → stop & report

Stop loop immediately. Report:

- **Dep**: name, current → attempted version
- **Layer**: which check failed
- **Error**: verbatim output (never summarize errors away)
- **Worktree**: path (KEPT for inspection)
- **Revert**: `git worktree remove <path> --force && git branch -D chore/deps-<YYYYMMDD>`

Then **triage** (ask user):

| Choice | Action |
|---|---|
| `now` | Attempt fix in worktree (error-dependent), re-run failing layer, resume loop |
| `later` | Leave worktree + branch in place, save report (`.opencode/thoughts/`), end |
| `discard` | Remove worktree + branch, end |

## Step 4 — Major pass (only with `--major` or explicit ask)

Per major bump, one at a time, behind **per-dep confirmation**:
1. Ask: `<pkg> <current> → <latest>` (major) — proceed?
2. Yes → `<pm> update <pkg> --latest` → full layer pass (majors always get full pass) → probe if frontend.
3. Fail → Step 3c triage.

## Step 5 — Summary + checkpoint re-check

1. Table: dep | from → to | layers result.
2. Re-run Step 0.3 Dependabot query → compare vs baseline: cleared? remaining? (act: no auto-fix of remaining, report only).
3. Ask: commit accumulated changes? (never auto-commit — user reviews diff first via `/review` if wanted).
4. **HUMAN-TEST GATE**: after commit → STOP. Present test options (diff review, manual layer re-run, post-merge smoke note). Wait for explicit human approval — only then merge to target branch (default `dev`, never `main` without separate squash ask).
5. After merge → **ask explicitly** whether to remove worktree + delete branch (never assume, even if cleanup was mentioned earlier).

## Step 6 — Trigger mode (first run only, PER REPO)

Config lookup: `./update-deps.config.json` (repo root) → fallback `~/.config/opencode/update-deps.config.json` (global default). Repo file exists → load silently, no question.

Missing → ask:

> How should future vulnerability notes trigger `/update-deps`?
> **A** — manual only (note shown at checkpoints, human runs command)
> **B** — note prompts "run /update-deps now?" at checkpoints (human confirms)
> **A+B** — note shown AND prompt offered (human always decides)
> **C** — scheduled auto-run (cron/CI; needs setup — future work)

Persist answer in REPO root (`./update-deps.config.json`):
```json
{ "trigger": "A|B|A+B|C", "firstRun": "<date>", "pmOverride": null }
```
Checkpoint behavior by mode: `A` = surface note only. `B`/`A+B` = surface note + ask "run /update-deps now?". `C` = note informational only (scheduler runs flow). `pmOverride` = per-repo PM forcing (future).

## Checkpoint note integration (other commands)

Commands `/security` and `/git`/`/git-workflow` (push subcommands) MUST run the Step 0.3 Dependabot query before completing and surface the note if open alerts exist. Same query, same format — never a proactive per-session check. Surface behavior follows repo's `update-deps.config.json` trigger mode (`A` = note only; `B`/`A+B` = note + "run /update-deps now?" prompt; `C` = note only, scheduler handles flow).
