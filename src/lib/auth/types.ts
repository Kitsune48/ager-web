export type AuthResultDto = {
  userId: number;
  accessToken: string;
  accessTokenExpiresAt: string;     // ISO
  refreshToken?: string | null;
  refreshTokenExpiresAt?: string | null;
};

export type LoginRequest = {
  email: string;
  password?: string | null;
  otpCode?: string | null;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password?: string | null;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};
