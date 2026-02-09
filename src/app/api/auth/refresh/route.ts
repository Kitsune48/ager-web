import { NextResponse } from "next/server";
import { readRefreshCookie, setRefreshCookie } from "@/lib/auth/cookie";
import type { AuthResultDto, RefreshTokenRequest } from "@/lib/auth/types";

const API_BASE = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  ""
);
const BACKEND_AUTH = `${API_BASE}/api/auth`;

export async function POST(req: Request) {
  const refreshCookie = await readRefreshCookie();
  let refreshToken: string | null = refreshCookie;
  if (!refreshToken) {
    try {
      const body = (await req.json()) as Partial<RefreshTokenRequest>;
      if (typeof body?.refreshToken === "string") refreshToken = body.refreshToken;
    } catch {
      // ignore
    }
  }

  if (!refreshToken) return NextResponse.json({ message: "No refresh token" }, { status: 401 });

  const res = await fetch(`${BACKEND_AUTH}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refreshToken } satisfies RefreshTokenRequest),
  });

  if (!res.ok) {
    return NextResponse.json({ message: "Refresh failed" }, { status: 401 });
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
