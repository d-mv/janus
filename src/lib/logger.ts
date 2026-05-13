export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogContextPrimitive = string | number | boolean | null;
export type LogContext = Record<string, LogContextPrimitive>;

type LogInput = {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
};

type LogPayload = {
  timestamp: string;
  level: LogLevel;
  message: string;
  session_id?: string;
  env?: string;
  context?: LogContext;
};

const SESSION_ID_STORAGE_KEY = "logger:session-id";
// const LOGGER_API_BASE_URL = import.meta.env.VITE_LOGGER_API_BASE_URL ?? "";
// const LOGGER_INGEST_KEY = import.meta.env.VITE_LOGGER_INGEST_KEY ?? "";
const LOGGER_ENV = import.meta.env.MODE;

const isPrimitive = (value: unknown): value is LogContextPrimitive =>
  value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";

function getSessionId(): string {
  const storage = typeof window !== "undefined" ? window.sessionStorage : null;
  const existing = storage?.getItem(SESSION_ID_STORAGE_KEY) ?? null;
  if (existing) {
    return existing;
  }

  const generated = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  storage?.setItem(SESSION_ID_STORAGE_KEY, generated);
  return generated;
}

export function sanitizeContext(input?: Record<string, unknown>): LogContext | undefined {
  if (!input) {
    return undefined;
  }

  const result: LogContext = {};
  for (const [key, value] of Object.entries(input)) {
    if (isPrimitive(value)) {
      result[key] = value;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export function buildLogPayload(input: LogInput): LogPayload {
  return {
    timestamp: new Date().toISOString(),
    level: input.level,
    message: input.message,
    session_id: getSessionId(),
    env: LOGGER_ENV,
    context: sanitizeContext(input.context)
  };
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
type SleepLike = (milliseconds: number) => Promise<void>;

export async function sendLog(
  baseUrl: string,
  ingestKey: string,
  payload: LogPayload,
  fetchImpl: FetchLike = fetch,
  sleepImpl: SleepLike = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
): Promise<void> {
  const url = `${baseUrl.replace(/\/+$/, "")}/v1/ingest`;
  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ingest-key": ingestKey
    },
    body: JSON.stringify(payload),
    keepalive: true
  };

  try {
    const response = await fetchImpl(url, requestInit);
    if (!response.ok && (response.status === 401 || response.status === 413 || response.status === 429)) {
      console.warn(`logger_api_status_${response.status}`);
    }
    return;
  } catch {
    await sleepImpl(250);
  }

  try {
    const retryResponse = await fetchImpl(url, requestInit);
    if (!retryResponse.ok && (retryResponse.status === 401 || retryResponse.status === 413 || retryResponse.status === 429)) {
      console.warn(`logger_api_status_${retryResponse.status}`);
    }
  } catch {
    // Logging must not break app flow.
  }
}

export function logEvent(_input: LogInput): void {
  // Logger disabled by user request to ignore logger-api
  return;
  /*
  if (!LOGGER_API_BASE_URL || !LOGGER_INGEST_KEY) {
    return;
  }

  const payload = buildLogPayload(input);
  void sendLog(LOGGER_API_BASE_URL, LOGGER_INGEST_KEY, payload);
  */
}
