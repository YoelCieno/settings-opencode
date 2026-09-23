# Stashed plugins (v1 API, incompatible with OpenCode v2)

This plugin still uses the OpenCode v1 plugin API and was stashed because
v2 auto-discovers everything in `plugins/`. Restore it to `plugins/` only
after porting it to the v2 API (`Plugin.define({ id, setup })`).

- `figma-mcp-trigger.js`
