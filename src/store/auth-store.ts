"use client";

import { create } from "zustand";

import { VENDOR_ROLE, getApiBaseUrl } from "@/config/auth";
import { getOrCreateDeviceId } from "@/lib/get-device-id";
import {
  claimsToVendorUser,
  decodeAccessToken,
  isVendorTokenClaims,
} from "@/lib/jwt-claims";
import { refreshTokensClient } from "@/services/auth-refresh-client";
import {
  clearAuthBundle,
  getSessionId,
  readAuthBundle,
  setAuthBundle,
} from "@/lib/auth-storage";
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

async function bindDeviceSession(refreshToken: string, sessionId?: string) {
  const { postAuthSessions } = await import(
    "@/services/vendor/auth-gateway-api"
  );
  const res = await postAuthSessions({
    refreshToken,
    deviceId: getOrCreateDeviceId(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  });
  return res.sessionId ?? res.session_id ?? sessionId;
}

async function finalizeGatewayAuth(
  accessToken: string,
  refreshToken: string,
  emailFallback: string,
  sessionIdFromLogin?: string,
  expiresAt?: number
) {
  const claims = decodeAccessToken(accessToken);
  if (!isVendorTokenClaims(claims)) {
    clearAuthBundle();
    throw new Error("not_vendor");
  }

  let sessionId = sessionIdFromLogin;
  if (!sessionId) {
    sessionId =
      typeof claims.session_id === "string" ? claims.session_id : undefined;
  }

  // The gateway requires an active session id for SessionActiveGuard on
  // authenticated endpoints and for token refresh. Prefer the id returned
  // by the login/refresh response, fall back to the JWT session_id claim,
  // and finally create a device session if neither is present.
  if (!sessionId && getApiBaseUrl()) {
    try {
      sessionId = await bindDeviceSession(refreshToken, sessionId);
    } catch {
      // If the JWT already exposes a session_id, use it as fallback.
      // Otherwise the gateway will reject protected calls and the user
      // can retry login once the backend is healthy.
    }
  }

  setAuthBundle({
    accessToken,
    refreshToken,
    sessionId,
    expiresAt,
  });

  const user = claimsToVendorUser(claims) ?? {
    id: String(claims.sub),
    email: emailFallback,
    role: VENDOR_ROLE,
    onboardingComplete: false,
  };

  useAuthStore.setState({
    accessToken,
    sessionId: sessionId ?? null,
    user,
    status: "authenticated",
  });

  // Load the vendor profile so downstream guards (VendorShell, login redirect)
  // can decide whether the user needs onboarding.
  try {
    const { useVendorProfileStore } = await import(
      "@/store/vendor-profile-store"
    );
    await useVendorProfileStore.getState().load({ force: true });
  } catch {
    // optional — gates fetch again if needed
  }

  return { accessToken, sessionId, user };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  sessionId: null,
  user: null,
  status: "idle",

  applyRefreshedAccess: (accessToken, sessionId) => {
    const nextSessionId = sessionId ?? get().sessionId;
    set({
      accessToken,
      sessionId: nextSessionId,
      status: "authenticated",
    });
    setAuthBundle({
      accessToken,
      sessionId: nextSessionId ?? undefined,
    });
  },

  bootstrap: async () => {
    set({ status: "loading" });

    const bundle = readAuthBundle();
    let access: string | null = bundle.accessToken ?? null;

    if (!access) {
      set({
        accessToken: null,
        sessionId: null,
        user: null,
        status: "unauthenticated",
      });
      return;
    }

    // Refresh proactively if the token is expired or about to expire.
    const expSeconds = (() => {
      try {
        const claims = decodeAccessToken(access);
        return typeof claims.exp === "number" ? claims.exp : null;
      } catch {
        return null;
      }
    })();

    if (expSeconds === null || expSeconds * 1000 <= Date.now() + 60_000) {
      access = await refreshTokensClient();
    }

    if (!access) {
      clearAuthBundle();
      set({
        accessToken: null,
        sessionId: null,
        user: null,
        status: "unauthenticated",
      });
      return;
    }

    set({ accessToken: access, sessionId: getSessionId() });

    try {
      const { getAuthMe } = await import(
        "@/services/vendor/auth-gateway-api"
      );
      const me = await getAuthMe();
      if (me.role !== VENDOR_ROLE) {
        clearAuthBundle();
        set({
          accessToken: null,
          sessionId: null,
          user: null,
          status: "unauthenticated",
        });
        throw new Error("not_vendor");
      }
      const user: VendorUser = {
        id: me.id,
        email: me.email ?? "",
        role: me.role,
        emailVerifiedAt: me.emailVerifiedAt,
        onboardingComplete: false,
      };
      set({ user, status: "authenticated" });
    } catch {
      clearAuthBundle();
      set({
        accessToken: null,
        sessionId: null,
        user: null,
        status: "unauthenticated",
      });
      return;
    }

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
        deviceId: getOrCreateDeviceId(),
      });
      const res = normalizeAuthResponse(raw);
      if (!res.accessToken || !res.refreshToken) {
        clearAuthBundle();
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
        res.sessionId || undefined,
        res.expiresAt || undefined
      );
    } catch (e) {
      clearAuthBundle();
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
    const { postAuthLoginPhone } = await import(
      "@/services/vendor/auth-gateway-api"
    );
    try {
      const raw = await postAuthLoginPhone({
        phone: payload.phone,
        password: payload.password,
        deviceId: getOrCreateDeviceId(),
      });
      const res = normalizeAuthResponse(raw);
      if (!res.accessToken || !res.refreshToken) {
        clearAuthBundle();
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
        res.sessionId || undefined,
        res.expiresAt || undefined
      );
    } catch (e) {
      clearAuthBundle();
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
    const { postAuthRegister } = await import(
      "@/services/vendor/auth-gateway-api"
    );
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
    const { postAuthRegisterPhone } = await import(
      "@/services/vendor/auth-gateway-api"
    );
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
        clearAuthBundle();
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
        res.sessionId || undefined,
        res.expiresAt || undefined
      );
    } catch (e) {
      clearAuthBundle();
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
    try {
      const { postAuthLogout } = await import(
        "@/services/vendor/auth-gateway-api"
      );
      await postAuthLogout();
    } catch {
      // Gateway logout failed — still clear local state.
    }
    try {
      const { useVendorProfileStore } = await import(
        "@/store/vendor-profile-store"
      );
      useVendorProfileStore.getState().reset();
    } catch {
      // ignore
    }
    clearAuthBundle();
    set({
      accessToken: null,
      sessionId: null,
      user: null,
      status: "unauthenticated",
    });
  },

  resendVerification: async (payload) => {
    const { postAuthResendVerification } = await import(
      "@/services/vendor/auth-gateway-api"
    );
    const res = await postAuthResendVerification(payload);
    return res;
  },

  changeEmail: async (payload) => {
    const { postAuthChangeEmail } = await import(
      "@/services/vendor/auth-gateway-api"
    );
    const res = await postAuthChangeEmail(payload);
    return res;
  },
}));
