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
import type { LoginRequest, RegisterRequest, VendorUser } from "@/types/auth";

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated";

type AuthState = {
  accessToken: string | null;
  user: VendorUser | null;
  status: AuthStatus;
  applyRefreshedAccess: (accessToken: string) => void;
  bootstrap: () => Promise<void>;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      async function finalizeGatewayAuth(
        accessToken: string,
        refreshToken: string,
        emailFallback: string
      ) {
        const claims = decodeAccessToken(accessToken);
        if (!isVendorTokenClaims(claims)) {
          set({ status: "unauthenticated", accessToken: null, user: null });
          throw new Error("not_vendor");
        }

        set({ accessToken, status: "loading" });

        let sessionId: string | undefined;
        if (getApiBaseUrl()) {
          try {
            const { postAuthSessions } = await import(
              "@/services/vendor/auth-gateway-api"
            );
            const { sessionId: sid } = await postAuthSessions({
              refreshToken,
              deviceId: getOrCreateDeviceId(),
              userAgent:
                typeof navigator !== "undefined"
                  ? navigator.userAgent
                  : undefined,
            });
            sessionId = sid;
          } catch {
            // Device session is optional; cookies still allow refresh when gateway supports it.
          }
        }

        await syncHttpOnlySession({
          accessToken,
          refreshToken,
          sessionId,
        });

        const user =
          claimsToVendorUser(claims) ?? {
            id: String(claims.sub),
            email: emailFallback,
            role: VENDOR_ROLE,
            onboardingComplete: false,
          };

        set({
          accessToken,
          user,
          status: "authenticated",
        });

        void (async () => {
          try {
            const { useVendorProfileStore } = await import(
              "@/store/vendor-profile-store"
            );
            await useVendorProfileStore.getState().load({ force: true });
          } catch {
            // optional — gates fetch again if needed
          }
        })();
      }

      return {
        accessToken: null,
        user: null,
        status: "idle",

        applyRefreshedAccess: (accessToken) => {
          set({ accessToken, status: "authenticated" });
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
            set({ accessToken: null, user: null, status: "unauthenticated" });
            return;
          }

          set({ accessToken: access });

          const remoteUser = await fetchSessionUser();
          if (!remoteUser) {
            await get().logout();
            return;
          }

          set({ user: remoteUser, status: "authenticated" });
          try {
            const { useVendorProfileStore } = await import(
              "@/store/vendor-profile-store"
            );
            await useVendorProfileStore.getState().load({ force: true });
          } catch {
            // ignore
          }
        },

        login: async (payload) => {
          set({ status: "loading" });
          const { postAuthLogin } = await import(
            "@/services/vendor/auth-gateway-api"
          );
          try {
            const raw = await postAuthLogin({
              email: payload.email,
              password: payload.password,
            });
            const res = normalizeAuthResponse(raw);
            if (!res.accessToken || !res.refreshToken) {
              set({ status: "unauthenticated", accessToken: null, user: null });
              throw new Error("sign_in_no_session");
            }
            await finalizeGatewayAuth(
              res.accessToken,
              res.refreshToken,
              payload.email
            );
          } catch (e) {
            set({ status: "unauthenticated", accessToken: null, user: null });
            throw e instanceof Error ? e : new Error("login_failed");
          }
        },

        register: async (payload) => {
          set({ status: "loading" });
          const { postAuthRegister } = await import(
            "@/services/vendor/auth-gateway-api"
          );
          try {
            const raw = await postAuthRegister({
              email: payload.email,
              password: payload.password,
              role: VENDOR_ROLE,
            });
            const res = normalizeAuthResponse(raw);
            if (!res.accessToken || !res.refreshToken) {
              set({ status: "unauthenticated", accessToken: null, user: null });
              throw new Error("signup_no_tokens");
            }
            await finalizeGatewayAuth(
              res.accessToken,
              res.refreshToken,
              payload.email
            );
          } catch (e) {
            set({ status: "unauthenticated", accessToken: null, user: null });
            throw e instanceof Error ? e : new Error("register_failed");
          }
        },

        logout: async () => {
          try {
            const { postAuthLogoutAll } = await import(
              "@/services/vendor/auth-gateway-api"
            );
            await postAuthLogoutAll();
          } catch {
            // Gateway logout failed — still clear local state.
          }
          try {
            await clearHttpOnlySession();
          } catch {
            // Network or CSRF mismatch — still clear client state below.
          } finally {
            try {
              const { useVendorProfileStore } = await import(
                "@/store/vendor-profile-store"
              );
              useVendorProfileStore.getState().reset();
            } catch {
              // ignore
            }
            set({ accessToken: null, user: null, status: "unauthenticated" });
          }
        },
      };
    },
    {
      name: "neoshop-vendor-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
