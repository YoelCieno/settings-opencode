# Stashed plugins (v1 API, incompatible with OpenCode v2)

These plugins still use the OpenCode v1 plugin API and were stashed because
v2 auto-discovers everything in `plugins/`. Restore one to `plugins/` only
after porting it to the v2 API (`Plugin.define({ id, setup })`).

- `ecc-hooks.ts`
- `figma-mcp-trigger.js`
- `continuous-learning-stop-hook.js`
