"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { VENDOR_ROLE, getApiBaseUrl } from "@/config/auth";
import { getOrCreateDeviceId } from "@/lib/get-device-id";
import {
  claimsToVendorUser,
  decodeAccessToken,
  isVendorTokenClaims,
} from "@/lib/jwt-claims";
import {
  clearHttpOnlySession,
  fetchAccessTokenFromCookie,
  fetchSessionUser,
  syncHttpOnlySession,
} from "@/services/auth-session-client";
import { normalizeAuthResponse } from "@/types/auth";
import type {
  ChangeEmailRequest,
  LoginRequest,
  PhoneLoginRequest,
  PhoneRegisterRequest,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationRequest,
  VendorUser,
} from "@/types/auth";

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated";

type AuthState = {
  accessToken: string | null;
  sessionId: string | null;
  user: VendorUser | null;
  status: AuthStatus;
  applyRefreshedAccess: (accessToken: string, sessionId?: string) => void;
  bootstrap: () => Promise<void>;
  login: (payload: LoginRequest) => Promise<void>;
  loginPhone: (payload: PhoneLoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<RegisterResponse>;
  registerPhone: (payload: PhoneRegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  resendVerification: (
    payload: ResendVerificationRequest
  ) => Promise<{ sent: boolean }>;
  changeEmail: (
    payload: ChangeEmailRequest
  ) => Promise<{ sent: boolean; message: string }>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      async function finalizeGatewayAuth(
        accessToken: string,
        refreshToken: string,
        emailFallback: string,
        sessionIdFromLogin?: string
      ) {
        const claims = decodeAccessToken(accessToken);
        if (!isVendorTokenClaims(claims)) {
          set({
            status: "unauthenticated",
            accessToken: null,
            sessionId: null,
            user: null,
          });
          throw new Error("not_vendor");
        }

        set({ accessToken, status: "loading" });

        let sessionId: string | undefined = sessionIdFromLogin;

        // The gateway requires an active session id for SessionActiveGuard on
        // authenticated endpoints and for token refresh. Prefer the id returned
        // by the login/refresh response, fall back to the JWT session_id claim,
        // and finally create a device session if neither is present.
        if (!sessionId) {
          sessionId = claims.session_id;
        }

        if (!sessionId && getApiBaseUrl()) {
          try {
            const { postAuthSessions } =
              await import("@/services/vendor/auth-gateway-api");
            const sessionRes = await postAuthSessions({
              refreshToken,
              deviceId: getOrCreateDeviceId(),
              userAgent:
                typeof navigator !== "undefined"
                  ? navigator.userAgent
                  : undefined,
            });
            sessionId = sessionRes.sessionId ?? sessionRes.session_id;
          } catch {
            // If the JWT already exposes a session_id, use it as fallback.
            // Otherwise the gateway will reject protected calls and the user
            // can retry login once the backend is healthy.
          }
        }

        await syncHttpOnlySession({
          accessToken,
          refreshToken,
          sessionId,
        });

        const user = claimsToVendorUser(claims) ?? {
          id: String(claims.sub),
          email: emailFallback,
          role: VENDOR_ROLE,
          onboardingComplete: false,
        };

        set({
          accessToken,
          sessionId: sessionId ?? null,
          user,
          status: "authenticated",
        });

        void (async () => {
          try {
            const { useVendorProfileStore } =
              await import("@/store/vendor-profile-store");
            await useVendorProfileStore.getState().load({ force: true });
          } catch {
            // optional — gates fetch again if needed
          }
        })();
      }

      return {
        accessToken: null,
        sessionId: null,
        user: null,
        status: "idle",

        applyRefreshedAccess: (accessToken, sessionId) => {
          set({
            accessToken,
            sessionId: sessionId ?? get().sessionId,
            status: "authenticated",
          });
        },

        bootstrap: async () => {
          set({ status: "loading" });

          let access = await fetchAccessTokenFromCookie();
          if (!access) {
            const { refreshTokensClient } =
              await import("@/services/auth-refresh-client");
            access = await refreshTokensClient();
          }

          if (!access) {
            set({
              accessToken: null,
              sessionId: null,
              user: null,
              status: "unauthenticated",
            });
            return;
          }

          set({ accessToken: access });

          let remoteUser = await fetchSessionUser();
          if (!remoteUser) {
            // The token from the cookie may be expired/invalid.
            // Try one explicit refresh before giving up.
            const { refreshTokensClient } =
              await import("@/services/auth-refresh-client");
            access = await refreshTokensClient();
            if (!access) {
              set({
                accessToken: null,
                sessionId: null,
                user: null,
                status: "unauthenticated",
              });
              return;
            }
            set({ accessToken: access });
            remoteUser = await fetchSessionUser();
          }

          if (!remoteUser) {
            set({
              accessToken: null,
              sessionId: null,
              user: null,
              status: "unauthenticated",
            });
            return;
          }

          set({ user: remoteUser, status: "authenticated" });
          try {
            const { useVendorProfileStore } =
              await import("@/store/vendor-profile-store");
            await useVendorProfileStore.getState().load({ force: true });
          } catch {
            // ignore
          }
        },

        login: async (payload) => {
          set({ status: "loading" });
          const { postAuthLogin } =
            await import("@/services/vendor/auth-gateway-api");
          try {
            const raw = await postAuthLogin({
              email: payload.email,
              password: payload.password,
              deviceId: getOrCreateDeviceId(),
            });
            const res = normalizeAuthResponse(raw);
            if (!res.accessToken || !res.refreshToken) {
              set({
                status: "unauthenticated",
                accessToken: null,
                sessionId: null,
                user: null,
              });
              throw new Error("sign_in_no_session");
            }
            await finalizeGatewayAuth(
              res.accessToken,
              res.refreshToken,
              payload.email,
              res.sessionId || undefined
            );
          } catch (e) {
            set({
              status: "unauthenticated",
              accessToken: null,
              sessionId: null,
              user: null,
            });
            throw e instanceof Error ? e : new Error("login_failed");
          }
        },

        loginPhone: async (payload) => {
          set({ status: "loading" });
          const { postAuthLoginPhone } =
            await import("@/services/vendor/auth-gateway-api");
          try {
            const raw = await postAuthLoginPhone({
              phone: payload.phone,
              password: payload.password,
              deviceId: getOrCreateDeviceId(),
            });
            const res = normalizeAuthResponse(raw);
            if (!res.accessToken || !res.refreshToken) {
              set({
                status: "unauthenticated",
                accessToken: null,
                sessionId: null,
                user: null,
              });
              throw new Error("sign_in_no_session");
            }
            await finalizeGatewayAuth(
              res.accessToken,
              res.refreshToken,
              payload.phone,
              res.sessionId || undefined
            );
          } catch (e) {
            set({
              status: "unauthenticated",
              accessToken: null,
              sessionId: null,
              user: null,
            });
            throw e instanceof Error ? e : new Error("login_failed");
          }
        },

        register: async (payload) => {
          set({ status: "loading" });
          const { postAuthRegister } =
            await import("@/services/vendor/auth-gateway-api");
          try {
            const res = await postAuthRegister({
              email: payload.email,
              password: payload.password,
              name: payload.name,
              surname: payload.surname,
              ...(payload.phone ? { phone: payload.phone } : {}),
              role: VENDOR_ROLE,
            });
            set({
              status: "unauthenticated",
              accessToken: null,
              sessionId: null,
              user: null,
            });
            return res;
          } catch (e) {
            set({
              status: "unauthenticated",
              accessToken: null,
              sessionId: null,
              user: null,
            });
            throw e instanceof Error ? e : new Error("register_failed");
          }
        },

        registerPhone: async (payload) => {
          set({ status: "loading" });
          const { postAuthRegisterPhone } =
            await import("@/services/vendor/auth-gateway-api");
          try {
            const raw = await postAuthRegisterPhone({
              phone: payload.phone,
              password: payload.password,
              name: payload.name,
              surname: payload.surname,
              role: VENDOR_ROLE,
            });
            const res = normalizeAuthResponse(raw);
            if (!res.accessToken || !res.refreshToken) {
              set({
                status: "unauthenticated",
                accessToken: null,
                sessionId: null,
                user: null,
              });
              throw new Error("signup_no_tokens");
            }
            await finalizeGatewayAuth(
              res.accessToken,
              res.refreshToken,
              payload.phone,
              res.sessionId || undefined
            );
          } catch (e) {
            set({
              status: "unauthenticated",
              accessToken: null,
              sessionId: null,
              user: null,
            });
            throw e instanceof Error ? e : new Error("register_failed");
          }
        },

        logout: async () => {
          const sid = get().sessionId;
          try {
            const { postAuthLogoutAll } =
              await import("@/services/vendor/auth-gateway-api");
            await postAuthLogoutAll(sid ?? "");
          } catch {
            // Gateway logout failed — still clear local state.
          }
          try {
            await clearHttpOnlySession();
          } catch {
            // Network or CSRF mismatch — still clear client state below.
          } finally {
            try {
              const { useVendorProfileStore } =
                await import("@/store/vendor-profile-store");
              useVendorProfileStore.getState().reset();
            } catch {
              // ignore
            }
            set({
              accessToken: null,
              sessionId: null,
              user: null,
              status: "unauthenticated",
            });
          }
        },

        resendVerification: async (payload) => {
          const { postAuthResendVerification } =
            await import("@/services/vendor/auth-gateway-api");
          const res = await postAuthResendVerification(payload);
          return res;
        },

        changeEmail: async (payload) => {
          const { postAuthChangeEmail } =
            await import("@/services/vendor/auth-gateway-api");
          const res = await postAuthChangeEmail(payload);
          return res;
        },
      };
    },
    {
      name: "neoshop-vendor-auth",
      // Do NOT persist the user object: it contains PII and permission/role
      // data that could be read or tampered with by XSS or browser extensions.
      // Re-fetch the user from /api/auth/me on each bootstrap instead.
      // The access token is persisted to avoid a rehydration gap where the
      // Axios interceptor has no token before bootstrap finishes; the token is
      // also available in the httpOnly cookie as the source of truth.
      partialize: (state) => ({
        accessToken: state.accessToken,
        sessionId: state.sessionId,
      }),
    }
  )
);
