import { describe, expect, it } from "vitest";
import { detectFormatFromFileName, parseSpecText, serializeSpec } from "./specText";

describe("parseSpecText", () => {
  it("parses JSON", () => {
    const parsed = parseSpecText('{"openapi":"3.1.0"}');
    expect(parsed.format).toBe("json");
    expect((parsed.doc as Record<string, string>).openapi).toBe("3.1.0");
  });

  it("parses YAML", () => {
    const parsed = parseSpecText(`asyncapi: 3.0.0
info:
  title: Example
`);
    expect(parsed.format).toBe("yaml");
    expect((parsed.doc as Record<string, string>).asyncapi).toBe("3.0.0");
  });

  it("throws on invalid text", () => {
    expect(() => parseSpecText("{not-valid")).toThrow();
  });
});

describe("serializeSpec", () => {
  it("serializes JSON", () => {
    const text = serializeSpec({ foo: "bar" }, "json");
    expect(text).toContain('"foo": "bar"');
  });

  it("serializes YAML", () => {
    const text = serializeSpec({ foo: "bar" }, "yaml");
    expect(text).toContain("foo: bar");
  });
});

describe("detectFormatFromFileName", () => {
  it("detects known extensions", () => {
    expect(detectFormatFromFileName("spec.yaml")).toBe("yaml");
    expect(detectFormatFromFileName("spec.yml")).toBe("yaml");
    expect(detectFormatFromFileName("spec.json")).toBe("json");
    expect(detectFormatFromFileName("spec.txt")).toBeNull();
  });
});
