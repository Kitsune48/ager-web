import { API_BASE } from "@/lib/api/client";
import type {
  UserProfileDto,
  UpdateMyProfileRequest,
  ChangeMyPasswordRequest,
  ResultEnvelope
} from "./me.types";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function parseResultError(res: Response) {
  const text = await res.text().catch(() => "");
  if (!text) return { message: `Request failed (${res.status})` };

  try {
    const json = JSON.parse(text) as ResultEnvelope<unknown>;
    const code = json.error ?? undefined;
    return {
      code,
      message: code ?? `Request failed (${res.status})`,
      details: json
    };
  } catch {
    return { message: text };
  }
}

async function authFetch(input: string, init: RequestInit, accessToken: string) {
  const res = await fetch(input, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${accessToken}`
    }
  });

  // If 401, clear cookies/state via your Next route handler and let UI redirect.
  if (res.status === 401) {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    throw new ApiError("unauthorized", 401, "unauthorized");
  }

  return res;
}

export async function getMe(accessToken: string): Promise<UserProfileDto> {
  const res = await authFetch(`${API_BASE}/api/me`, { method: "GET" }, accessToken);

  if (!res.ok) {
    const err = await parseResultError(res);
    throw new ApiError(err.message, res.status, err.code, err.details);
  }

  return (await res.json()) as UserProfileDto;
}

export async function patchMe(
  body: UpdateMyProfileRequest,
  accessToken: string
): Promise<UserProfileDto> {
  const res = await authFetch(
    `${API_BASE}/api/me`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    },
    accessToken
  );

  if (!res.ok) {
    const err = await parseResultError(res);
    throw new ApiError(err.message, res.status, err.code, err.details);
  }

  return (await res.json()) as UserProfileDto;
}

export async function changeMyPassword(
  body: ChangeMyPasswordRequest,
  accessToken: string
): Promise<void> {
  const res = await authFetch(
    `${API_BASE}/api/me/change-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    },
    accessToken
  );

  if (res.status === 204) return;

  const err = await parseResultError(res);
  throw new ApiError(err.message, res.status, err.code, err.details);
}

export async function deleteMe(accessToken: string): Promise<void> {
  const res = await authFetch(
    `${API_BASE}/api/me`,
    { method: "DELETE" },
    accessToken
  );

  if (res.status === 204) return;

  const err = await parseResultError(res);
  throw new ApiError(err.message, res.status, err.code, err.details);
}
