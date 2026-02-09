import { parseApiError } from "@/lib/api/errors";
import type {
  AuthResultDto,
  LoginRequest,
  RegisterRequest,
  RequestForgotPasswordOtpCodeRequest,
  RequestLoginOtpCodeRequest,
  RequestRegisterOtpCodeRequest,
  ResetForgotPasswordRequest,
} from "@/lib/auth/types";

export type { LoginRequest, RegisterRequest, AuthResultDto };

async function postJson<T>(path: string, body?: unknown, headers?: HeadersInit): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) throw await parseApiError(res);
  return (await res.json()) as T;
}

async function postNoContent(path: string, body?: unknown, headers?: HeadersInit): Promise<void> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw await parseApiError(res);
}

export async function requestLoginOtp(email: string): Promise<void> {
  await postNoContent("/api/auth/login/request-code", { email } satisfies RequestLoginOtpCodeRequest);
}

export async function loginWithOtp(email: string, otpCode: string): Promise<AuthResultDto> {
  return postJson<AuthResultDto>("/api/auth/login", { email, otpCode } satisfies LoginRequest);
}

export async function loginWithPassword(email: string, password: string): Promise<AuthResultDto> {
  return postJson<AuthResultDto>("/api/auth/login", { email, password } satisfies LoginRequest);
}

export async function requestRegisterOtp(username: string, email: string): Promise<void> {
  await postNoContent("/api/auth/register/request-code", { username, email } satisfies RequestRegisterOtpCodeRequest);
}

export async function requestPasswordResetOtp(email: string): Promise<void> {
  await postNoContent(
    "/api/auth/forgot-password/request-code",
    { email } satisfies RequestForgotPasswordOtpCodeRequest
  );
}

export async function resetPassword(email: string, otpCode: string, newPassword: string): Promise<void> {
  await postNoContent(
    "/api/auth/forgot-password/reset",
    { email, otpCode, newPassword } satisfies ResetForgotPasswordRequest
  );
}

export async function registerWithOtp(
  username: string,
  email: string,
  otpCode: string,
  password?: string | null
): Promise<AuthResultDto> {
  const body: RegisterRequest = {
    username,
    email,
    otpCode,
    ...(password ? { password } : {}),
  };

  return postJson<AuthResultDto>("/api/auth/register", body);
}

// Uses the httpOnly refresh cookie managed by Next.js route handlers.
export async function refresh(refreshToken?: string): Promise<AuthResultDto> {
  return postJson<AuthResultDto>(
    "/api/auth/refresh",
    refreshToken ? { refreshToken } : undefined
  );
}

// Logout forwards Authorization + refreshToken cookie to backend.
export async function logout(accessToken: string | null, refreshToken?: string): Promise<void> {
  await postNoContent(
    "/api/auth/logout",
    refreshToken ? { refreshToken } : undefined,
    accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
  );
}

// Back-compat helper for callers that still use a single login(payload).
export async function login(body: LoginRequest): Promise<AuthResultDto> {
  return postJson<AuthResultDto>("/api/auth/login", body);
}
