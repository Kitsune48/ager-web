import { NextResponse } from "next/server";
import { readRefreshCookie, setRefreshCookie } from "@/lib/auth/cookie";
import type { AuthResultDto, RefreshTokenRequest } from "@/lib/auth/types";

const API_BASE = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  ""
);
const BACKEND_AUTH = `${API_BASE}/api/auth`;

export async function POST() {
  const refresh = await readRefreshCookie();
  if (!refresh) {
    return NextResponse.json({ message: "No refresh token" }, { status: 401 });
  }

  const res = await fetch(`${BACKEND_AUTH}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh } satisfies RefreshTokenRequest),
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
