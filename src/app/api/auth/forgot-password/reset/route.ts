import { NextResponse } from "next/server";
import type { ResetForgotPasswordRequest } from "@/lib/auth/types";

const API_BASE = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  ""
);
const BACKEND_AUTH = `${API_BASE}/api/auth`;

export async function POST(req: Request) {
  const body = (await req.json()) as ResetForgotPasswordRequest;

  const res = await fetch(`${BACKEND_AUTH}/forgot-password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await safeJson(res);
    return NextResponse.json(err ?? { message: "Reset password failed" }, { status: res.status });
  }

  const data = await safeJson(res);
  return NextResponse.json(data ?? { ok: true });
}

async function safeJson(r: Response) {
  try {
    return await r.json();
  } catch {
    return null;
  }
}
