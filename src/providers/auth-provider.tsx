"use client";

import { useEffect } from "react";

import { getTokenExpSecondsSafe } from "@/lib/jwt-claims";
import { getExpiresAt, getSessionId } from "@/lib/auth-storage";
import { refreshTokensClient } from "@/services/auth-refresh-client";
import { useAuthStore } from "@/store/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Bootstrap auth state from the localStorage token bundle on mount.
  useEffect(() => {
    void useAuthStore.getState().bootstrap();
  }, []);

  const accessToken = useAuthStore((s) => s.accessToken);

  // Proactive refresh shortly before the access token expires.
  useEffect(() => {
    if (!accessToken) return;

    const exp = getTokenExpSecondsSafe(accessToken);
    if (!exp) return;

    const storedExpiresAt = getExpiresAt();
    const expMs = storedExpiresAt ? storedExpiresAt * 1000 : exp * 1000;

    const now = Date.now();
    const refreshLeadMs = 60_000;
    const fireAt = expMs - refreshLeadMs;
    const ms = fireAt <= now ? 0 : Math.max(fireAt - now, 15_000);
    const id = window.setTimeout(() => {
      void refreshTokensClient().then((token) => {
        if (token) {
          // The refresh client already updated localStorage. Just sync the
          // Zustand state so UI timers and the socket stay consistent.
          useAuthStore
            .getState()
            .applyRefreshedAccess(token, getSessionId() ?? undefined);
        }
      });
    }, ms);

    return () => window.clearTimeout(id);
  }, [accessToken]);

  // When the tab becomes visible after being hidden (sleep / background),
  // re-check the token and refresh if it has expired or is about to expire.
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState !== "visible") return;
      const token = useAuthStore.getState().accessToken;
      if (!token) return;
      const exp = getTokenExpSecondsSafe(token);
      if (!exp) return;
      if (exp * 1000 <= Date.now() + 60_000) {
        void refreshTokensClient().then((t) => {
          if (t) {
            useAuthStore
              .getState()
              .applyRefreshedAccess(t, getSessionId() ?? undefined);
          }
          // If refresh fails, do NOT wipe auth here.
          // The next API call will hit the 401 interceptor and retry
          // refresh once. Only if that also fails will the user be
          // properly redirected to login. This avoids logging out on
          // transient network hiccups when the tab wakes up.
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisible);
    return () => document.removeEventListener("visibilitychange", handleVisible);
  }, []);

  return children;
}
