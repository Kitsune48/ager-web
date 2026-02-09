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

export type RequestLoginOtpCodeRequest = {
  email: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  otpCode: string;
  password?: string | null;
};

export type RequestRegisterOtpCodeRequest = {
  username: string;
  email: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type LogoutRequest = {
  refreshToken: string;
};
