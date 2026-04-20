import { parseApiError } from "@/lib/api/errors";

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: HeadersInit;
  body?: unknown;
  accessToken?: string;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  cache?: RequestCache;
};

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "X-CSRF-TOKEN";

function readCsrfFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie;
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [name, ...rest] = part.split("=");
    if (name?.trim() === CSRF_COOKIE) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }
  return null;
}

function buildHeaders(options: ApiRequestOptions, expectsJson: boolean): Headers {
  const headers = new Headers(options.headers ?? {});

  if (expectsJson && !headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  // Double-submit CSRF: on every state-changing request, if the XSRF-TOKEN cookie exists
  // (set by GET /api/auth/csrf) mirror it into the X-CSRF-TOKEN header. Both the Next.js
  // edge (enforceCsrfIfCookiePresent) and the backend (RequireCsrfIfConfigured) require
  // the match. If the cookie is absent (non-browser client), we skip — the backend treats
  // this as a non-cookie flow and the edge lets it through.
  const method = (options.method ?? "GET").toUpperCase();
  if (STATE_CHANGING_METHODS.has(method) && !headers.has(CSRF_HEADER)) {
    const csrf = readCsrfFromCookie();
    if (csrf) headers.set(CSRF_HEADER, csrf);
  }

  return headers;
}

async function sendRequest(
  input: string,
  options: ApiRequestOptions = {},
  expectsJson: boolean
): Promise<Response> {
  const response = await fetch(input, {
    method: options.method ?? "GET",
    headers: buildHeaders(options, expectsJson),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
    credentials: options.credentials,
    cache: options.cache,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response;
}

export async function requestJson<T>(
  input: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const response = await sendRequest(input, options, true);
  return (await response.json()) as T;
}

export async function requestVoid(
  input: string,
  options: ApiRequestOptions = {}
): Promise<void> {
  await sendRequest(input, options, false);
}

export async function requestMaybeJson<T>(
  input: string,
  options: ApiRequestOptions = {}
): Promise<T | null> {
  const response = await sendRequest(input, options, false);
  const contentType = response.headers.get("content-type");

  if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
    return null;
  }

  return (await response.json()) as T;
}