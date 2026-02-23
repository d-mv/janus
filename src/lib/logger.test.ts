import { describe, expect, it, vi } from "vitest";
import { buildLogPayload, sanitizeContext, sendLog } from "./logger";

describe("sanitizeContext", () => {
  it("keeps only primitive values", () => {
    const result = sanitizeContext({
      a: 1,
      b: "x",
      c: true,
      d: null,
      e: { nested: true },
      f: [1, 2, 3],
      g: undefined
    });

    expect(result).toEqual({ a: 1, b: "x", c: true, d: null });
  });
});

describe("buildLogPayload", () => {
  it("builds payload with required fields", () => {
    const payload = buildLogPayload({ level: "info", message: "hello" });
    expect(payload.level).toBe("info");
    expect(payload.message).toBe("hello");
    expect(typeof payload.timestamp).toBe("string");
    expect(payload.session_id).toBeTruthy();
  });
});

describe("sendLog", () => {
  it("retries once on fetch rejection", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("net"))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));

    await sendLog(
      "https://logger-api.fly.dev",
      "key-1",
      buildLogPayload({ level: "warn", message: "retry" }),
      fetchMock,
      () => Promise.resolve()
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
