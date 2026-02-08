import { API_BASE } from "@/lib/api/client";
import { parseApiError } from "@/lib/api/errors";
import type { AuthResultDto, LoginRequest } from "@/lib/auth/types";

export type { LoginRequest, AuthResultDto };

export async function login(body: LoginRequest): Promise<AuthResultDto> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  return (await res.json()) as AuthResultDto;
}
