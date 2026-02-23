import { deflate, inflate } from "pako";

export const SCHEMA_HASH_PREFIX = "schema=v1.deflate.";

export type ResolveSource = "hash" | "local" | "fallback";

export type ResolveInitialSchemaInput = {
  hash: string;
  localSchema: string | null;
  fallbackSchema: string;
};

export type ResolveInitialSchemaResult = {
  schemaText: string;
  source: ResolveSource;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(payload: string): Uint8Array {
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

export function createShareHash(schemaText: string): string {
  const compressed = deflate(encoder.encode(schemaText));
  const payload = bytesToBase64Url(compressed);
  return `${SCHEMA_HASH_PREFIX}${payload}`;
}

export function decodeShareHash(hash: string): string | null {
  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!normalized.startsWith(SCHEMA_HASH_PREFIX)) {
    return null;
  }

  const payload = normalized.slice(SCHEMA_HASH_PREFIX.length);
  if (!payload) {
    return null;
  }

  try {
    const compressed = base64UrlToBytes(payload);
    const decompressed = inflate(compressed);
    return decoder.decode(decompressed);
  } catch {
    return null;
  }
}

export function estimateCompressedBytes(schemaText: string): number {
  return deflate(encoder.encode(schemaText)).byteLength;
}

export function resolveInitialSchema(input: ResolveInitialSchemaInput): ResolveInitialSchemaResult {
  const fromHash = decodeShareHash(input.hash);
  if (fromHash !== null) {
    return { schemaText: fromHash, source: "hash" };
  }

  if (input.localSchema !== null && input.localSchema.trim().length > 0) {
    return { schemaText: input.localSchema, source: "local" };
  }

  return { schemaText: input.fallbackSchema, source: "fallback" };
}
