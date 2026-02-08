export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:8080";

type FetchOptions = {
  headers?: HeadersInit;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  signal?: AbortSignal;
  cache?: RequestCache;          // allow Next.js cache hints like "no-store"
  next?: NextFetchRequestConfig; // to want to pass { revalidate: ... } 
};

export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(opts.headers ?? {}),
  };

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    credentials: "include",
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
