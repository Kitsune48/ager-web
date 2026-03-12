import { beforeEach, describe, expect, it, vi } from "vitest";

import { refresh, storeRefreshToken } from "@/lib/api/auth";

const { requestJsonMock } = vi.hoisted(() => ({
  requestJsonMock: vi.fn(),
}));

vi.mock("@/lib/api/request", () => ({
  requestJson: requestJsonMock,
  requestVoid: vi.fn(),
}));

describe("auth refresh", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    requestJsonMock.mockReset();
    window.localStorage.clear();
    storeRefreshToken(null, null);
  });

  it("uses the latest refresh token from localStorage across tabs", async () => {
    requestJsonMock.mockResolvedValue({
      userId: "user-1",
      accessToken: "access-2",
      accessTokenExpiresAt: "2026-03-12T12:30:00.000Z",
      refreshToken: "refresh-2",
      refreshTokenExpiresAt: "2026-03-26T12:00:00.000Z",
    });

    storeRefreshToken("refresh-1", "2026-03-26T11:00:00.000Z");
    window.localStorage.setItem("ager.refreshToken", "refresh-from-other-tab");
    window.localStorage.setItem("ager.refreshTokenExpiresAt", "2026-03-26T12:00:00.000Z");

    await refresh();

    expect(requestJsonMock).toHaveBeenCalledWith(
      "/api/auth/refresh",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        body: { refreshToken: "refresh-from-other-tab" },
      })
    );
  });

  it("still attempts cookie-based refresh when no client token is stored", async () => {
    requestJsonMock.mockResolvedValue({
      userId: "user-1",
      accessToken: "access-2",
      accessTokenExpiresAt: "2026-03-12T12:30:00.000Z",
    });

    await refresh();

    expect(requestJsonMock).toHaveBeenCalledWith(
      "/api/auth/refresh",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      })
    );
  });
});