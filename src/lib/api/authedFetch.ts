import { useSession, useAuthActions } from "@/lib/auth/session";

// Usage inside client components/hooks
export function useAuthedFetch() {
  const { accessToken } = useSession();
  const { refresh, logout } = useAuthActions();

  return async function authedFetch(input: RequestInfo | URL, init?: RequestInit) {
    const res = await fetch(input, withAuth(init, accessToken));
    if (res.status !== 401) return res;

    // Try one refresh
    try {
      await refresh();
      const res2 = await fetch(input, withAuth(init, accessToken));
      if (res2.status === 401) await logout();
      return res2;
    } catch {
      await logout();
      return res;
    }
  };
}

function withAuth(init: RequestInit | undefined, token: string | null) {
  return {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as any),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}
