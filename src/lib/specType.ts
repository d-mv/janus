export type SpecKind = "openapi" | "asyncapi" | "unknown";

export function detectSpecKind(spec: unknown): SpecKind {
  if (!spec || typeof spec !== "object") {
    return "unknown";
  }

  const doc = spec as Record<string, unknown>;

  if (typeof doc.asyncapi === "string") {
    return "asyncapi";
  }

  if (typeof doc.openapi === "string" || typeof doc.swagger === "string") {
    return "openapi";
  }

  return "unknown";
}
