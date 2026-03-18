import { describe, expect, it, vi } from "vitest";

import {
  appendObservabilityHeaders,
  createProxyRequestContext,
  pickRequestHeaders,
} from "@/app/api/auth/_shared";

describe("proxy observability helpers", () => {
  it("creates context from incoming request headers", () => {
    const req = new Request("http://localhost/api/test", {
      headers: {
        "x-request-id": "req-1",
        "x-correlation-id": "corr-1",
        traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00",
      },
    });

    const ctx = createProxyRequestContext(req);

    expect(ctx.requestId).toBe("req-1");
    expect(ctx.correlationId).toBe("corr-1");
    expect(ctx.traceparent).toContain("4bf92f3577b34da6a3ce929d0e0e4736");
  });

  it("sanitizes request and correlation IDs to prevent newline injection", () => {
    const req = {
      headers: {
        get(name: string) {
          if (name.toLowerCase() === "x-request-id") return "req\r\n123";
          if (name.toLowerCase() === "x-correlation-id") return "corr\nxyz";
          return null;
        },
      },
    } as Request;

    const ctx = createProxyRequestContext(req);

    expect(ctx.requestId).toBe("req123");
    expect(ctx.correlationId).toBe("corrxyz");
  });

  it("falls back to generated request ID when headers are missing", () => {
    const randomSpy = vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("generated-id");
    const req = new Request("http://localhost/api/test");

    const ctx = createProxyRequestContext(req);

    expect(ctx.requestId).toBe("generated-id");
    expect(ctx.correlationId).toBe("generated-id");
    randomSpy.mockRestore();
  });

  it("appends observability headers to outgoing header object", () => {
    const headers: Record<string, string> = { "content-type": "application/json" };

    const result = appendObservabilityHeaders(headers, {
      requestId: "req-42",
      correlationId: "corr-42",
      traceparent: "trace-42",
    });

    expect(result["x-request-id"]).toBe("req-42");
    expect(result["x-correlation-id"]).toBe("corr-42");
    expect(result.traceparent).toBe("trace-42");
  });

  it("pickRequestHeaders returns sanitized values only for requested names", () => {
    const req = {
      headers: {
        get(name: string) {
          if (name.toLowerCase() === "authorization") return "Bearer token";
          if (name.toLowerCase() === "x-csrf-token") return "csrf\r\nvalue";
          if (name.toLowerCase() === "cookie") return "a=1";
          return null;
        },
      },
    } as Request;

    const selected = pickRequestHeaders(req, ["authorization", "x-csrf-token"]);

    expect(selected.authorization).toBe("Bearer token");
    expect(selected["x-csrf-token"]).toBe("csrfvalue");
    expect(selected.cookie).toBeUndefined();
  });
});