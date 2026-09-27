import { expect } from "bun:test";

/** Minimal structural view of a v2 plugin: `{ id, setup }`. */
export interface V2PluginShape {
  readonly id: string;
  readonly setup: (ctx: unknown) => Promise<unknown> | unknown;
}

/** Factory return type: destructured by test consumers. */
export interface V2ShapeFactory {
  readonly assertV2Plugin: (mod: unknown, expectedId?: string) => V2PluginShape;
  readonly systemText: (system: unknown) => string;
}

export function v2Shape(): V2ShapeFactory {
  /** Type predicate so `typeof === "function"` narrows to the setup signature. */
  const isSetupFn = (value: unknown): value is V2PluginShape["setup"] =>
    typeof value === "function";

  /**
   * Mirrors the v2 loader schema (verified from opencode2 binary +
   * node_modules/@opencode/plugin v2.0.13, dist/promise/plugin.d.ts):
   * default export MUST be an object `{ id: string, setup: Function }`
   * (canonical authoring: `Plugin.define({ id, async setup(ctx) {...} })`).
   *
   * Takes `unknown` so module namespaces pass directly, no call-site casts.
   * Throws (failing the test) when the module still uses the v1 API
   * (named export, or default-exported function).
   */
  const assertV2Plugin = (mod: unknown, expectedId?: string): V2PluginShape => {
    if (typeof mod !== "object" || mod === null || !("default" in mod)) {
      throw new Error("v2 default export missing: module still uses v1 named export?");
    }
    const def: unknown = mod.default;
    expect(def, "v2 default export missing: module still uses v1 named export?").toBeDefined();
    if (typeof def !== "object" || def === null) {
      throw new Error("v2 default export must be an object { id, setup }, not a function (v1 style)");
    }
    expect(typeof def, "v2 default export must be an object { id, setup }, not a function (v1 style)").toBe("object");
    if (!("id" in def) || !("setup" in def)) {
      throw new Error("v2 plugin must export { id, setup }");
    }
    const id: unknown = def.id;
    const setup: unknown = def.setup;
    expect(typeof id, "v2 plugin `id` must be a string").toBe("string");
    if (typeof id !== "string") throw new Error("v2 plugin `id` must be a string");
    expect(id.length, "v2 plugin `id` must be non-empty").toBeGreaterThan(0);
    if (expectedId !== undefined) expect(id).toBe(expectedId);
    expect(typeof setup, "v2 plugin `setup` must be a function").toBe("function");
    if (!isSetupFn(setup)) throw new Error("v2 plugin `setup` must be a function");
    return { id, setup };
  };

  /** Extract readable text from a v2 `session.hook("context")` system array. */
  const systemText = (system: unknown): string => {
    if (!Array.isArray(system)) return "";
    return system
      .map((part: unknown): string => {
        if (typeof part === "string") return part;
        if (typeof part === "object" && part !== null && "text" in part) {
          const text: unknown = part.text;
          if (typeof text === "string") return text;
        }
        try {
          return JSON.stringify(part) ?? "";
        } catch {
          return "";
        }
      })
      .join("\n");
  };

  return { assertV2Plugin, systemText };
}
