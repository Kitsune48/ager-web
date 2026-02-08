import { NextResponse } from "next/server";

type RestoreAccountByEmailRequest = {
  email: string;
  oldPassword: string;
};

const API_BASE =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

export async function POST(request: Request) {
  let body: RestoreAccountByEmailRequest;

  try {
    body = (await request.json()) as RestoreAccountByEmailRequest;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const oldPassword = (body.oldPassword ?? "").trim();

  if (!email) {
    return NextResponse.json({ error: "email_required" }, { status: 400 });
  }
  if (!oldPassword) {
    return NextResponse.json({ error: "old_password_required" }, { status: 400 });
  }

  const res = await fetch(`${API_BASE}/api/auth/restore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, oldPassword }),
  });

  if (!res.ok) {
    // Forward your backend Result/ProblemDetails JSON as-is
    const text = await res.text().catch(() => "");
    return new NextResponse(text || null, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
