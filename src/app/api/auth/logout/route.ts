import { NextResponse } from "next/server";
import { readRefreshCookie, clearRefreshCookie } from "@/lib/auth/cookie";

const API_BASE = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  ""
);
const BACKEND_AUTH = `${API_BASE}/api/auth`;

export async function POST() {
  const refresh = await readRefreshCookie();

  if (refresh) {
    try {
      await fetch(`${BACKEND_AUTH}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh })
      });
    } catch {
      // ignore network errors on logout
    }
  }

  await clearRefreshCookie();
  return NextResponse.json({ ok: true });
}
