import { NextResponse } from "next/server";

function getApiBase() {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8080"
  ).replace(/\/+$/, "");
}

async function proxyReadingLists(req: Request, extraPath: string) {
  const apiBase = getApiBase();
  const url = new URL(req.url);
  const backendUrl = `${apiBase}/api/reading-lists${extraPath}${url.search}`;

  const headers: Record<string, string> = {};
  const auth = req.headers.get("authorization");
  if (auth) headers["authorization"] = auth;

  const contentType = req.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  const accept = req.headers.get("accept");
  if (accept) headers["accept"] = accept;

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const res = await fetch(backendUrl, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const resContentType = res.headers.get("content-type") ?? "";
  const isJson = resContentType.includes("application/json");

  if (isJson) {
    const data = await res.json().catch(() => null);
    return NextResponse.json(data, { status: res.status });
  }

  const text = await res.text().catch(() => "");
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": resContentType || "text/plain" },
  });
}

export async function GET(req: Request) {
  return proxyReadingLists(req, "");
}

export async function POST(req: Request) {
  return proxyReadingLists(req, "");
}
