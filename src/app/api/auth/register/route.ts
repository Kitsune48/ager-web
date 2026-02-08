import { NextResponse } from "next/server";
import { setRefreshCookie } from "@/lib/auth/cookie";
import type { AuthResultDto, RegisterRequest } from "@/lib/auth/types";

const API_BASE = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  ""
);
const BACKEND_AUTH = `${API_BASE}/api/auth`;

export async function POST(req: Request) {
  const body = (await req.json()) as RegisterRequest;

  const res = await fetch(`${BACKEND_AUTH}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await safeJson(res);
    return NextResponse.json(err ?? { message: "Register failed" }, { status: res.status });
  }

  const data = (await res.json()) as AuthResultDto;

  if (data.refreshToken) {
    await setRefreshCookie(data.refreshToken, data.refreshTokenExpiresAt ?? null);
  }

  return NextResponse.json({
    userId: data.userId,
    accessToken: data.accessToken,
    accessTokenExpiresAt: data.accessTokenExpiresAt
  });
}

async function safeJson(r: Response) { try { return await r.json(); } catch { return null; } }
