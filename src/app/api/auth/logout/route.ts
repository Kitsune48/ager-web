import { NextResponse } from "next/server";
import { readRefreshCookie, clearRefreshCookie } from "@/lib/auth/cookie";
import type { LogoutRequest } from "@/lib/auth/types";

const API_BASE = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  ""
);
const BACKEND_AUTH = `${API_BASE}/api/auth`;

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") ?? undefined;
  const refreshCookie = await readRefreshCookie();

  let refreshToken: string | null = refreshCookie;
  if (!refreshToken) {
    try {
      const body = (await req.json()) as Partial<LogoutRequest>;
      if (typeof body?.refreshToken === "string") refreshToken = body.refreshToken;
    } catch {
      // ignore
    }
  }

  if (refreshToken) {
    try {
      await fetch(`${BACKEND_AUTH}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({ refreshToken: refreshToken } satisfies LogoutRequest),
      });
    } catch {
      // ignore network errors on logout
    }
  }

  await clearRefreshCookie();
  return NextResponse.json({ ok: true });
}
