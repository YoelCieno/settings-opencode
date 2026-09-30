# Continuous migration plan for flagged vulnerabilities (pencil)

Idea: continuous migration plan, executed when flags report vulnerabilities
(e.g. Dependabot alerts — currently 3 on default branch: 2 high, 1 low).

Sketch:
- Trigger: new vulnerability flag lands (Dependabot PR / advisory)
- Triage: severity + affected dep (prod vs dev) → priority bucket
- Migrate in small increments behind flags where possible:
  breaking majors → adapter/shim first, behavior-flag, cut over, remove shim
- Each increment = one commit, gated by tests + verification gate
- Track per-flag state (queued → patched → verified) so no alert rots
- Cadence: batch weekly; high-sev → immediate

Deferred — no action yet.
