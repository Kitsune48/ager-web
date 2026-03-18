import { NextResponse } from "next/server";
import {
  appendObservabilityHeaders,
  createProxyRequestContext,
  logProxyEvent,
} from "@/app/api/auth/_shared";

const API_BASE = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  ""
);

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestContext = createProxyRequestContext(request);
  const url = new URL(request.url);

  const backendUrl = `${API_BASE}/api/feed${url.search}`;
  const authorization = request.headers.get("authorization") ?? undefined;

  const res = await fetch(backendUrl, {
    method: "GET",
    headers: appendObservabilityHeaders({
      ...(authorization ? { Authorization: authorization } : {}),
      Accept: "application/json",
    }, requestContext),
    cache: "no-store",
  });

  logProxyEvent(
    res.ok ? "Information" : "Warning",
    "proxy_request_completed",
    "Feed proxy request completed.",
    {
      request_id: requestContext.requestId,
      correlation_id: requestContext.correlationId,
      upstream_path: "/api/feed",
      status_code: res.status,
      duration_ms: Date.now() - startedAt,
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return new NextResponse(text || null, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
