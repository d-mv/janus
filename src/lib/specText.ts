import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

export type SpecTextFormat = "json" | "yaml";

export type ParsedSpecText = {
  doc: unknown;
  format: SpecTextFormat;
};

export function parseSpecText(text: string): ParsedSpecText {
  try {
    return {
      doc: JSON.parse(text),
      format: "json"
    };
  } catch (jsonError) {
    try {
      return {
        doc: parseYaml(text),
        format: "yaml"
      };
    } catch (yamlError) {
      const message = yamlError instanceof Error ? yamlError.message : "Invalid schema text";
      throw new Error(message || (jsonError instanceof Error ? jsonError.message : "Invalid schema text"));
    }
  }
}

export function serializeSpec(doc: unknown, format: SpecTextFormat): string {
  if (format === "json") {
    return `${JSON.stringify(doc, null, 2)}\n`;
  }

  return stringifyYaml(doc, {
    lineWidth: 0
  });
}

export function detectFormatFromFileName(fileName: string): SpecTextFormat | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".json")) {
    return "json";
  }

  if (lower.endsWith(".yaml") || lower.endsWith(".yml")) {
    return "yaml";
  }

  return null;
}
