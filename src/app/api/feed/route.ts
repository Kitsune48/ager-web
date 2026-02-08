import { NextResponse } from "next/server";

const API_BASE = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  ""
);

export async function GET(request: Request) {
  const url = new URL(request.url);

  const backendUrl = `${API_BASE}/api/feed${url.search}`;
  const authorization = request.headers.get("authorization") ?? undefined;

  const res = await fetch(backendUrl, {
    method: "GET",
    headers: {
      ...(authorization ? { Authorization: authorization } : {}),
      Accept: "application/json",
    },
    cache: "no-store",
  });

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
