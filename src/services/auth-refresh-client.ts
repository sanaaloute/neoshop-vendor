import axios from "axios";

import {
  clearAuthBundle,
  getRefreshToken,
  getSessionId,
  setAuthBundle,
} from "@/lib/auth-storage";
import { postAuthRefresh } from "@/services/vendor/auth-gateway-api";

let inFlight: Promise<string | null> | null = null;

export function refreshTokensClient(): Promise<string | null> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const sessionId = getSessionId();
    const refreshToken = getRefreshToken();

    if (!sessionId || !refreshToken) {
      return null;
    }

    try {
      const data = await postAuthRefresh({ sessionId, refreshToken });
      const accessToken = data.accessToken;
      const newRefreshToken = data.refreshToken ?? refreshToken;
      const newSessionId = data.sessionId ?? data.session_id ?? sessionId;
      const expiresAt =
        data.expiresAt !== undefined
          ? Number(data.expiresAt)
          : data.expires_at !== undefined
            ? Number(data.expires_at)
            : undefined;

      setAuthBundle({
        accessToken,
        refreshToken: newRefreshToken,
        sessionId: newSessionId,
        expiresAt:
          expiresAt && Number.isFinite(expiresAt) ? expiresAt : undefined,
      });

      const { useAuthStore } = await import("@/store/auth-store");
      useAuthStore.getState().applyRefreshedAccess(accessToken, newSessionId);

      return accessToken;
    } catch (e) {
      const status = axios.isAxiosError(e) ? e.response?.status : undefined;
      const isAuthError = status === 401 || status === 403;

      if (isAuthError) {
        // Refresh token or session is no longer valid; clear state so the
        // user is redirected to login.
        clearAuthBundle();
        const { useAuthStore } = await import("@/store/auth-store");
        useAuthStore.setState({
          accessToken: null,
          user: null,
          sessionId: null,
          status: "unauthenticated",
        });
      } else {
        // Transient network/server errors: keep the existing token bundle so
        // the next API call can retry refresh.
        console.warn("[refresh] transient refresh failure, status:", status, e);
      }

      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
