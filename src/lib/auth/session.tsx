"use client";

import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { parseApiError } from "@/lib/api/errors";

type SessionState = {
  userId: number | null;
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
};

type AuthActions = {
  login: (payload: { email: string; password?: string | null; otpCode?: string | null }) => Promise<void>;
  register: (payload: { username: string; email: string; password?: string | null }) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const SessionCtx = createContext<SessionState | null>(null);
const ActionsCtx = createContext<AuthActions | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ userId: null, accessToken: null, accessTokenExpiresAt: null });

  const login = useCallback(async (payload: { email: string; password?: string | null; otpCode?: string | null }) => {
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) throw await parseApiError(res);
    const data = await res.json();
    setState({ userId: data.userId, accessToken: data.accessToken, accessTokenExpiresAt: data.accessTokenExpiresAt });
  }, []);

  const register = useCallback(async (payload: { username: string; email: string; password?: string | null }) => {
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error("Register failed");
    const data = await res.json();
    setState({ userId: data.userId, accessToken: data.accessToken, accessTokenExpiresAt: data.accessTokenExpiresAt });
  }, []);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    if (!res.ok) throw new Error("Refresh failed");
    const data = await res.json();
    setState({ userId: data.userId, accessToken: data.accessToken, accessTokenExpiresAt: data.accessTokenExpiresAt });
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({ userId: null, accessToken: null, accessTokenExpiresAt: null });
  }, []);

  const actions = useMemo<AuthActions>(() => ({ login, register, refresh, logout }), [login, register, refresh, logout]);

  return (
    <SessionCtx.Provider value={state}>
      <ActionsCtx.Provider value={actions}>{children}</ActionsCtx.Provider>
    </SessionCtx.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

export function useAuthActions() {
  const ctx = useContext(ActionsCtx);
  if (!ctx) throw new Error("useAuthActions must be used within SessionProvider");
  return ctx;
}
