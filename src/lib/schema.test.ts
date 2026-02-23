import { describe, expect, it } from "vitest";
import { createShareHash, decodeShareHash, resolveInitialSchema } from "./schema";

const sample = '{"openapi":"3.0.0","info":{"title":"T","version":"1.0.0"}}';

describe("schema share hash", () => {
  it("encodes and decodes JSON text", () => {
    const hash = createShareHash(sample);
    expect(hash.startsWith("schema=v1.deflate.")).toBe(true);

    const decoded = decodeShareHash(`#${hash}`);
    expect(decoded).toBe(sample);
  });

  it("returns null for invalid hash", () => {
    expect(decodeShareHash("#schema=v1.deflate.bad")).toBeNull();
    expect(decodeShareHash("#not-schema=abc")).toBeNull();
  });
});

describe("initial load priority", () => {
  it("prefers hash over localStorage and fallback", () => {
    const result = resolveInitialSchema({
      hash: `#${createShareHash(sample)}`,
      localSchema: "{}",
      fallbackSchema: "{\"fallback\":true}"
    });

    expect(result.source).toBe("hash");
    expect(result.schemaText).toBe(sample);
  });

  it("falls back to localStorage then sample", () => {
    const fromLocal = resolveInitialSchema({
      hash: "",
      localSchema: "{\"saved\":true}",
      fallbackSchema: "{\"fallback\":true}"
    });
    expect(fromLocal.source).toBe("local");

    const fromFallback = resolveInitialSchema({
      hash: "",
      localSchema: null,
      fallbackSchema: "{\"fallback\":true}"
    });
    expect(fromFallback.source).toBe("fallback");
  });
});
