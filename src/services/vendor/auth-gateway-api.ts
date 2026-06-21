import { vendorApiClient } from "@/services/api/client";
import type {
  ChangeEmailRequest,
  ChangeEmailResponse,
  LoginResponse,
  PhoneLoginInitiateRequest,
  PhoneLoginInitiateResponse,
  PhoneLoginVerifyRequest,
  PhoneRegisterInitiateRequest,
  PhoneRegisterInitiateResponse,
  PhoneRegisterVerifyRequest,
  ReactivateRequest,
  ReactivateResponse,
  RegisterResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
} from "@/types/auth";

import type { AuthMeResponse, AuthRefreshRequest, AuthRefreshResponse, AuthSessionResponse } from "./types";

/** POST /auth/refresh — exchange refresh token for a new access token */
export async function postAuthRefresh(body: AuthRefreshRequest) {
  const { data } = await vendorApiClient.post<AuthRefreshResponse>("/api/v1/auth/refresh", body);
  return data;
}

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
  phone?: string;
  role?: string;
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

/** POST /auth/resend-verification */
export async function postAuthResendVerification(body: ResendVerificationRequest) {
  const { data } = await vendorApiClient.post<ResendVerificationResponse>(
    "/api/v1/auth/resend-verification",
    body
  );
  return data;
}

/** POST /auth/register/phone/initiate */
export async function postAuthRegisterPhoneInitiate(body: PhoneRegisterInitiateRequest) {
  const { data } = await vendorApiClient.post<PhoneRegisterInitiateResponse>(
    "/api/v1/auth/register/phone/initiate",
    body
  );
  return data;
}

/** POST /auth/register/phone/verify */
export async function postAuthRegisterPhoneVerify(body: PhoneRegisterVerifyRequest) {
  const { data } = await vendorApiClient.post<LoginResponse>(
    "/api/v1/auth/register/phone/verify",
    body
  );
  return data;
}

/** POST /auth/login/phone/initiate */
export async function postAuthLoginPhoneInitiate(body: PhoneLoginInitiateRequest) {
  const { data } = await vendorApiClient.post<PhoneLoginInitiateResponse>(
    "/api/v1/auth/login/phone/initiate",
    body
  );
  return data;
}

/** POST /auth/login/phone/verify */
export async function postAuthLoginPhoneVerify(body: PhoneLoginVerifyRequest) {
  const { data } = await vendorApiClient.post<LoginResponse>(
    "/api/v1/auth/login/phone/verify",
    body
  );
  return data;
}

/** POST /auth/change-email (authenticated) */
export async function postAuthChangeEmail(body: ChangeEmailRequest) {
  const { data } = await vendorApiClient.post<ChangeEmailResponse>(
    "/api/v1/auth/change-email",
    body
  );
  return data;
}

/** POST /auth/reactivate — reactivate a suspended/deactivated account */
export async function postAuthReactivate(body: ReactivateRequest) {
  const { data } = await vendorApiClient.post<ReactivateResponse>(
    "/api/v1/auth/reactivate",
    body
  );
  return data;
}
