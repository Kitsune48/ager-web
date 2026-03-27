import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
const sessionState = vi.hoisted(() => ({
  current: {
    ready: false,
    userId: null,
    accessToken: null,
    accessTokenExpiresAt: null,
  } as {
    ready: boolean;
    userId: string | null;
    accessToken: string | null;
    accessTokenExpiresAt: string | null;
  },
}));

vi.mock("@/i18n/useAppLocale", () => ({
  useAppLocale: () => ({ locale: "en" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock("@/lib/auth/session", () => ({
  useSession: () => sessionState.current,
}));

import RequireAuth from "@/components/auth/RequireAuth";

describe("RequireAuth", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    sessionState.current = {
      ready: false,
      userId: null,
      accessToken: null,
      accessTokenExpiresAt: null,
    };
  });

  it("renders protected content when authenticated", async () => {
    sessionState.current = {
      ready: true,
      userId: "user-1",
      accessToken: "access-1",
      accessTokenExpiresAt: null,
    };

    render(
      <RequireAuth>
        <div>secret</div>
      </RequireAuth>
    );

    expect(await screen.findByText("secret")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirects to login when auth is ready but missing access token", async () => {
    sessionState.current = {
      ready: true,
      userId: null,
      accessToken: null,
      accessTokenExpiresAt: null,
    };

    render(
      <RequireAuth>
        <div>secret</div>
      </RequireAuth>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/en/login");
    });
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });
});
