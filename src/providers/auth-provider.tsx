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

  return children;
}
