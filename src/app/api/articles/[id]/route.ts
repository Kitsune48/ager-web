import { NextResponse } from "next/server";

const API_BASE = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  ""
);

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const res = await fetch(`${API_BASE}/api/articles/${encodeURIComponent(id)}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    try {
      const json = text ? JSON.parse(text) : null;
      return NextResponse.json(json ?? { message: text || "Article fetch failed" }, { status: res.status });
    } catch {
      return NextResponse.json({ message: text || "Article fetch failed" }, { status: res.status });
    }
  }

  const data = await res.json();
  return NextResponse.json(data);
}