export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:8080";

type FetchOptions = {
  headers?: HeadersInit;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  cache?: RequestCache;          // allow Next.js cache hints like "no-store"
  next?: NextFetchRequestConfig; // to want to pass { revalidate: ... } 
};

function buildUrl(baseUrl: string, path: string) {
  if (!baseUrl) return path;
  return `${baseUrl}${path}`;
}

async function doFetch<T>(baseUrl: string, path: string, opts: FetchOptions = {}): Promise<T> {
  const url = buildUrl(baseUrl, path);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(opts.headers ?? {}),
  };

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    credentials: opts.credentials ?? "omit",
    cache: opts.cache,
    next: opts.next,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data?.title ?? data?.message ?? message;
    } catch {}
    throw new Error(message);
  }

  return (await res.json()) as T;
}

// Calls the backend directly (cross-origin in production)
export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  return doFetch<T>(API_BASE, path, opts);
}

// Calls this Next.js app origin (same-origin) – useful for route handlers that proxy to the backend
export async function appFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  return doFetch<T>("", path, opts);
}
