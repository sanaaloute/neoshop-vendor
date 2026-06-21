"use client";

import { useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  suspendUserMe,
  requestDeletionUserMe,
} from "@/services/vendor/users-api";
import { useAuthStore } from "@/store/auth-store";
import type { UserMeResponse } from "@/services/vendor/types";

/** Account lifecycle actions for the current user (suspend / request deletion). */
export function useUserLifecycle() {
  const [user, setUser] = useState<UserMeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const logout = useAuthStore.getState().logout;

  const suspend = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const data = await suspendUserMe();
      setUser(data);
      setSuccess(true);
      // A suspended account can no longer use the dashboard; sign out locally
      // and update the auth store immediately so gates/shell reflect it.
      await logout();
      return data;
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not suspend account."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const requestDeletion = useCallback(async (password: string) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const data = await requestDeletionUserMe({ password });
      setSuccess(true);
      return data;
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not request account deletion."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    success,
    suspend,
    requestDeletion,
  };
}
