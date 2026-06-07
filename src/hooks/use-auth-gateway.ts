"use client";

import { useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  postAuthRefresh,
  getAuthMe,
  postAuthLogout,
} from "@/services/vendor/auth-gateway-api";
import type { AuthMeResponse, AuthRefreshRequest } from "@/services/vendor/types";

/** Direct gateway auth operations (bypasses the Next.js proxy when needed). */
export function useAuthGateway() {
  const [me, setMe] = useState<AuthMeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (body: AuthRefreshRequest) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await postAuthRefresh(body);
      return data;
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Refresh failed."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMe = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAuthMe();
      setMe(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not fetch auth profile."));
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async (sessionId: string) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      await postAuthLogout(sessionId);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Logout failed."));
    } finally {
      setLoading(false);
    }
  }, []);

  return { me, loading, error, refresh, fetchMe, logout };
}
