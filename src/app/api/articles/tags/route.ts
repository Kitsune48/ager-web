import { NextResponse } from "next/server";

const API_BASE = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080"
).replace(/\/+$/, "");

const BACKEND = `${API_BASE}/api/articles/tags`;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  let res: Response;
  try {
    res = await fetch(BACKEND, {
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
      return NextResponse.json(json ?? { message: errText || "Tags fetch failed" }, { status: res.status });
    } catch {
      return NextResponse.json({ message: errText || "Tags fetch failed" }, { status: res.status });
    }
  }

  const data = await res.json();
  return NextResponse.json(data);
}
