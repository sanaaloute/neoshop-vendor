import { vendorApiClient } from "@/services/api/client";
import type { LoginResponse } from "@/types/auth";

import type { AuthMeResponse, AuthSessionResponse } from "./types";

/** GET /auth/me — Bearer required */
export async function getAuthMe() {
  const { data } = await vendorApiClient.get<AuthMeResponse>("/api/v1/auth/me");
  return data;
}

/** POST /auth/login — email/password via gateway */
export async function postAuthLogin(body: { email: string; password: string }) {
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
  const { data } = await vendorApiClient.post<LoginResponse>("/api/v1/auth/register", body);
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

/** POST /auth/logout — requires X-Session-ID */
export async function postAuthLogout(sessionId: string) {
  const { data } = await vendorApiClient.post<{ revoked: boolean }>("/api/v1/auth/logout", {}, { headers: { "X-Session-ID": sessionId } });
  return data;
}

/** POST /auth/logout/all */
export async function postAuthLogoutAll() {
  const { data } = await vendorApiClient.post<{ revoked: number }>("/api/v1/auth/logout/all", {});
  return data;
}
