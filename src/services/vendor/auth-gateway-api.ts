import { vendorApiClient } from "@/services/api/client";
import type { LoginResponse, RegisterResponse } from "@/types/auth";

import type { AuthMeResponse, AuthSessionResponse } from "./types";

/** GET /auth/me — Bearer required */
export async function getAuthMe() {
  const { data } = await vendorApiClient.get<AuthMeResponse>("/api/v1/auth/me");
  return data;
}

/** POST /auth/login — email/password via gateway */
export async function postAuthLogin(body: {
  email: string;
  password: string;
  deviceId: string;
}) {
  const { data } = await vendorApiClient.post<LoginResponse>("/api/v1/auth/login", body);
  return data;
}

/** POST /auth/register — email/password registration via gateway */
export async function postAuthRegister(body: {
  email: string;
  password: string;
  name?: string;
  surname?: string;
  role: string;
}) {
  const { data } = await vendorApiClient.post<RegisterResponse>("/api/v1/auth/register", body);
  return data;
}

/** POST /auth/sessions — register device session */
export async function postAuthSessions(body: {
  refreshToken: string;
  deviceId: string;
  userAgent?: string;
}) {
  const { data } = await vendorApiClient.post<AuthSessionResponse>("/api/v1/auth/sessions", body);
  return data;
}

/** POST /auth/logout — requires x-session-id */
export async function postAuthLogout(sessionId: string) {
  const { data } = await vendorApiClient.post<{ revoked: boolean }>(
    "/api/v1/auth/logout",
    {},
    { headers: { "x-session-id": sessionId } }
  );
  return data;
}

/** POST /auth/logout/all */
export async function postAuthLogoutAll(sessionId: string) {
  const { data } = await vendorApiClient.post<{ revoked: number }>(
    "/api/v1/auth/logout/all",
    {},
    { headers: { "x-session-id": sessionId } }
  );
  return data;
}

/** POST /auth/forgot-password */
export async function postAuthForgotPassword(body: { email: string }) {
  const { data } = await vendorApiClient.post<{ sent: boolean }>(
    "/api/v1/auth/forgot-password",
    body
  );
  return data;
}

/** POST /auth/reset-password */
export async function postAuthResetPassword(body: {
  token: string;
  newPassword: string;
}) {
  const { data } = await vendorApiClient.post<{ success: boolean }>(
    "/api/v1/auth/reset-password",
    body
  );
  return data;
}
