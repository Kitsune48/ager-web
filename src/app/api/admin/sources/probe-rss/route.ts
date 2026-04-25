import { NextResponse } from "next/server";

// Proxy for backend POST /api/admin/sources/probe-rss. The backend performs a one-shot
// outbound HTTP fetch (with the SSRF guard) to validate that the URL points at an actual
// RSS/Atom feed. The result is surfaced as-is so the admin UI can render diagnostics.
//
// We forward Authorization, Cookie, and X-CSRF-TOKEN exactly like the create proxy: the
// backend gates this endpoint with role admin + RequireCsrfIfConfigured, and the
// antiforgery cookie+token pair must travel together.
const API_BASE = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

export async function POST(request: Request) {
  const backendUrl = `${API_BASE}/api/admin/sources/probe-rss`;
  const authorization = request.headers.get("authorization") ?? undefined;
  const cookie = request.headers.get("cookie") ?? undefined;
  const csrf = request.headers.get("x-csrf-token") ?? undefined;
  const contentType = request.headers.get("content-type") ?? "application/json";
  const body = await request.text();

  const res = await fetch(backendUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": contentType,
      ...(authorization ? { Authorization: authorization } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}),
    },
    body,
    cache: "no-store",
  });

  const responseBody = await res.text();
  return new NextResponse(responseBody || null, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
