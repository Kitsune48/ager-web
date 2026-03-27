import { beforeEach, describe, expect, it, vi } from "vitest";

import { refresh, storeRefreshToken } from "@/lib/api/auth";

const { requestJsonMock } = vi.hoisted(() => ({
  requestJsonMock: vi.fn(),
}));
const { requestVoidMock } = vi.hoisted(() => ({
  requestVoidMock: vi.fn(),
}));

vi.mock("@/lib/api/request", () => ({
  requestJson: requestJsonMock,
  requestVoid: requestVoidMock,
}));

describe("auth api", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    requestJsonMock.mockReset();
    requestVoidMock.mockReset();
    window.localStorage.clear();
    storeRefreshToken(null, null);
  });

  it("uses the latest refresh token from localStorage across tabs", async () => {
    const refreshExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const rotatedRefreshExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    requestJsonMock.mockResolvedValue({
      userId: "user-1",
      accessToken: "access-2",
      accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      refreshToken: "refresh-2",
      refreshTokenExpiresAt: rotatedRefreshExpiresAt,
    });

    storeRefreshToken("refresh-1", refreshExpiresAt);
    window.localStorage.setItem("ager.refreshToken", "refresh-from-other-tab");
    window.localStorage.setItem("ager.refreshTokenExpiresAt", refreshExpiresAt);

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
      accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
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

  it("sends honeypot and captcha token with register OTP requests", async () => {
    requestVoidMock.mockResolvedValue(undefined);

    const { requestRegisterOtp } = await import("@/lib/api/auth");

    await requestRegisterOtp("new_user", "new@example.com", {
      honeypot: "",
      captchaToken: "captcha-ok",
    });

    expect(requestVoidMock).toHaveBeenCalledWith(
      "/api/auth/register/request-code",
      expect.objectContaining({
        method: "POST",
        body: {
          username: "new_user",
          email: "new@example.com",
          honeypot: "",
          captchaToken: "captcha-ok",
        },
      })
    );
  });
});
