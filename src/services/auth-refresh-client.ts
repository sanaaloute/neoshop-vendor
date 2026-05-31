import { refreshSessionRequest } from "@/services/auth-session-client";
import { useAuthStore } from "@/store/auth-store";

let inFlight: Promise<string | null> | null = null;

export function refreshTokensClient(): Promise<string | null> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const data = await refreshSessionRequest();
      useAuthStore.getState().applyRefreshedAccess(data.accessToken, data.sessionId);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
