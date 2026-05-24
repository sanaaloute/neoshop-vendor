"use client";

import { useEffect } from "react";

import { getTokenExpSecondsSafe } from "@/lib/jwt-claims";
import { refreshTokensClient } from "@/services/auth-refresh-client";
import { useAuthStore } from "@/store/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const finishHydration = useAuthStore.persist.onFinishHydration(() => {
      void useAuthStore.getState().bootstrap();
    });

    const persistApi = useAuthStore.persist as {
      hasHydrated?: () => boolean;
    };
    if (persistApi.hasHydrated?.()) {
      void useAuthStore.getState().bootstrap();
    }

    return finishHydration;
  }, []);

  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    const exp = getTokenExpSecondsSafe(accessToken);
    if (!exp) return;

    const now = Date.now();
    const refreshLeadMs = 60_000;
    const fireAt = exp * 1000 - refreshLeadMs;
    const ms = fireAt <= now ? 0 : Math.max(fireAt - now, 15_000);
    const id = window.setTimeout(() => {
      void refreshTokensClient().then((token) => {
        if (token) {
          void useAuthStore.getState().bootstrap();
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
            void useAuthStore.getState().bootstrap();
          } else {
            useAuthStore.setState({
              accessToken: null,
              user: null,
              status: "unauthenticated",
            });
          }
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisible);
    return () => document.removeEventListener("visibilitychange", handleVisible);
  }, []);

  return children;
}
