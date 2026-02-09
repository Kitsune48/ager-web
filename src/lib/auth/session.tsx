"use client";

import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { ApiError } from "@/lib/api/errors";
import {
  login as apiLogin,
  refresh as apiRefresh,
  logout as apiLogout,
  registerWithOtp as apiRegisterWithOtp,
  requestLoginOtp as apiRequestLoginOtp,
  requestRegisterOtp as apiRequestRegisterOtp,
} from "@/lib/api/auth";

type SessionState = {
  userId: number | null;
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
};

type AuthActions = {
  requestLoginOtp: (email: string) => Promise<void>;
  login: (payload: { email: string; password?: string | null; otpCode?: string | null }) => Promise<void>;
  requestRegisterOtp: (payload: { username: string; email: string }) => Promise<void>;
  register: (payload: { username: string; email: string; otpCode: string; password?: string | null }) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const SessionCtx = createContext<SessionState | null>(null);
const ActionsCtx = createContext<AuthActions | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ userId: null, accessToken: null, accessTokenExpiresAt: null });

  const requestLoginOtp = useCallback(async (email: string) => {
    await apiRequestLoginOtp(email);
  }, []);

  const login = useCallback(async (payload: { email: string; password?: string | null; otpCode?: string | null }) => {
    const hasPassword = !!payload.password;
    const hasOtp = !!payload.otpCode;
    if (!hasPassword && !hasOtp) {
      throw new ApiError("Missing credentials", 400, "missing_credentials");
    }

    const data = await apiLogin(payload);
    setState({ userId: data.userId, accessToken: data.accessToken, accessTokenExpiresAt: data.accessTokenExpiresAt });
  }, []);

  const requestRegisterOtp = useCallback(async (payload: { username: string; email: string }) => {
    await apiRequestRegisterOtp(payload.username, payload.email);
  }, []);

  const register = useCallback(async (payload: { username: string; email: string; otpCode: string; password?: string | null }) => {
    const data = await apiRegisterWithOtp(payload.username, payload.email, payload.otpCode, payload.password);
    setState({ userId: data.userId, accessToken: data.accessToken, accessTokenExpiresAt: data.accessTokenExpiresAt });
  }, []);

  const refresh = useCallback(async () => {
    const data = await apiRefresh();
    setState({ userId: data.userId, accessToken: data.accessToken, accessTokenExpiresAt: data.accessTokenExpiresAt });
  }, []);

  const logout = useCallback(async () => {
    await apiLogout(state.accessToken);
    setState({ userId: null, accessToken: null, accessTokenExpiresAt: null });
  }, [state.accessToken]);

  const actions = useMemo<AuthActions>(
    () => ({ requestLoginOtp, login, requestRegisterOtp, register, refresh, logout }),
    [requestLoginOtp, login, requestRegisterOtp, register, refresh, logout]
  );

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
