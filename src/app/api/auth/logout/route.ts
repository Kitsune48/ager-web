import { NextResponse } from "next/server";
import { readRefreshCookie, clearRefreshCookie } from "@/lib/auth/cookie";
import type { LogoutRequest } from "@/lib/auth/types";
import {
  appendObservabilityHeaders,
  createProxyRequestContext,
  getApiBase,
  logProxyEvent,
  pickRequestHeaders,
  toProxyResponse,
} from "@/app/api/auth/_shared";

const API_BASE = getApiBase();
const BACKEND_AUTH = `${API_BASE}/api/auth`;

export async function POST(req: Request) {
  const startedAt = Date.now();
  const requestContext = createProxyRequestContext(req);
  const refreshCookie = await readRefreshCookie();

  let refreshToken: string | null = refreshCookie;
  if (!refreshToken) {
    try {
      const body = (await req.json()) as Partial<LogoutRequest>;
      if (typeof body?.refreshToken === "string") refreshToken = body.refreshToken;
    } catch {
      // ignore
    }
  }

  if (refreshToken) {
    try {
      const upstream = await fetch(`${BACKEND_AUTH}/logout`, {
        method: "POST",
        headers: appendObservabilityHeaders({
          "Content-Type": "application/json",
          ...pickRequestHeaders(req, ["authorization", "x-csrf-token", "cookie"]),
        }, requestContext),
        body: JSON.stringify({ refreshToken: refreshToken } satisfies LogoutRequest),
      });

      logProxyEvent(
        upstream.ok ? "Information" : "Warning",
        "proxy_request_completed",
        "Auth logout proxy request completed.",
        {
          request_id: requestContext.requestId,
          correlation_id: requestContext.correlationId,
          upstream_path: "/api/auth/logout",
          status_code: upstream.status,
          duration_ms: Date.now() - startedAt,
        }
      );

      await clearRefreshCookie();
      return toProxyResponse(upstream);
    } catch {
      logProxyEvent("Error", "proxy_request_failed", "Auth logout proxy request failed.", {
        request_id: requestContext.requestId,
        correlation_id: requestContext.correlationId,
        upstream_path: "/api/auth/logout",
        duration_ms: Date.now() - startedAt,
      });
      // ignore network errors on logout
    }
  }

  await clearRefreshCookie();
  return NextResponse.json({ ok: true });
}
