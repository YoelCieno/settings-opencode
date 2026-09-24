import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "jsonc-parser";

const ROOT = join(import.meta.dir, "..");
const SCHEMA_PATH = join(ROOT, "schema", "opencode.config.json");
const CONFIG_PATH = join(ROOT, "opencode.jsonc");
const REMOTE_URL = "https://opencode.ai/config.json";

function record(value: unknown, what: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null) throw new Error(`${what}: not an object`);
  return value as Record<string, unknown>;
}

function at(value: unknown, path: string[]): unknown {
  let cur: unknown = value;
  for (const key of path) cur = record(cur, key)[key];
  return cur;
}

function loadSchema(): Record<string, unknown> {
  if (!existsSync(SCHEMA_PATH)) throw new Error("schema/opencode.config.json missing — run the patch step");
  const parsed: unknown = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
  return record(parsed, "schema");
}

function loadConfig(): Record<string, unknown> {
  const parsed: unknown = parse(readFileSync(CONFIG_PATH, "utf8"));
  return record(parsed, "opencode.jsonc");
}

describe("local patched config schema (V2 mcp.servers)", () => {
  test("exists and records upstream source + patch notes", () => {
    const s = loadSchema();
    expect(s["x-source"]).toBe(REMOTE_URL);
    expect(String(s["x-patched"])).toContain("servers");
    expect(String(s["x-fetched"])).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("mcp accepts V2 `servers` map of server configs", () => {
    const refs = JSON.stringify(at(loadSchema(), ["$defs", "Config", "properties", "mcp", "properties", "servers", "additionalProperties"]));
    expect(refs).toContain("#/$defs/McpLocalConfig");
    expect(refs).toContain("#/$defs/McpRemoteConfig");
  });

  test("V1 direct server-map shape still accepted (compat)", () => {
    const refs = JSON.stringify(at(loadSchema(), ["$defs", "Config", "properties", "mcp", "additionalProperties"]));
    expect(refs).toContain("#/$defs/McpLocalConfig");
  });

  test("Mcp*Config know `disabled` (V2) and `enabled` (V1), stay closed objects", () => {
    for (const name of ["McpLocalConfig", "McpRemoteConfig"]) {
      const def = at(loadSchema(), ["$defs", name]);
      const props = record(at(def, ["properties"]), `${name}.properties`);
      expect(record(props["disabled"], `${name}.disabled`).type).toBe("boolean");
      expect(record(props["enabled"], `${name}.enabled`).type).toBe("boolean");
      expect(at(def, ["additionalProperties"])).toBe(false);
    }
  });

  test("opencode.jsonc $schema points at local patched schema", () => {
    expect(at(loadConfig(), ["$schema"])).toBe("./schema/opencode.config.json");
  });

  test("repo mcp.servers entries conform to schema requirements", () => {
    const servers = record(at(loadConfig(), ["mcp", "servers"]), "mcp.servers");
    const names = Object.keys(servers);
    expect(names).toContain("context7");
    for (const name of names) {
      const server = record(servers[name], `mcp.servers.${name}`);
      expect(typeof server.type).toBe("string");
      if (server.type === "local") {
        const cmd = server.command;
        expect(Array.isArray(cmd)).toBe(true);
        if (!Array.isArray(cmd)) throw new Error(`${name}: command not an array`);
        for (const part of cmd) expect(typeof part).toBe("string");
      } else if (server.type === "remote") {
        expect(typeof server.url).toBe("string");
      }
      if ("disabled" in server) expect(typeof server.disabled).toBe("boolean");
      if ("enabled" in server) expect(typeof server.enabled).toBe("boolean");
    }
  });
});
