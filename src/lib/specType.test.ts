import { describe, expect, it } from "vitest";
import { detectSpecKind } from "./specType";

describe("detectSpecKind", () => {
  it("detects OpenAPI", () => {
    expect(detectSpecKind({ openapi: "3.1.0" })).toBe("openapi");
    expect(detectSpecKind({ swagger: "2.0" })).toBe("openapi");
  });

  it("detects AsyncAPI", () => {
    expect(detectSpecKind({ asyncapi: "3.0.0" })).toBe("asyncapi");
  });

  it("returns unknown for unsupported docs", () => {
    expect(detectSpecKind({ title: "x" })).toBe("unknown");
  });
});
