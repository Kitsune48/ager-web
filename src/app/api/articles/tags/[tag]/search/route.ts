import { NextResponse } from "next/server";

const API_BASE = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080"
).replace(/\/+$/, "");

export async function GET(req: Request, ctx: { params: Promise<{ tag: string }> }) {
  const { tag } = await ctx.params;

  const url = new URL(req.url);
  const page = url.searchParams.get("page") ?? "1";
  const pageSize = url.searchParams.get("pageSize") ?? "20";

  const backendUrl = new URL(`${API_BASE}/api/articles/tags/${encodeURIComponent(tag)}/search`);
  backendUrl.searchParams.set("page", page);
  backendUrl.searchParams.set("pageSize", pageSize);

  const authHeader = req.headers.get("authorization");

  let res: Response;
  try {
    res = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Backend unreachable" }, { status: 502 });
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    try {
      const json = errText ? JSON.parse(errText) : null;
      return NextResponse.json(json ?? { message: errText || "Tag search failed" }, { status: res.status });
    } catch {
      return NextResponse.json({ message: errText || "Tag search failed" }, { status: res.status });
    }
  }

  const data = await res.json();
  return NextResponse.json(data);
}
