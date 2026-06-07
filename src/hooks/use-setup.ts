"use client";

import { useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { getSetupStatus, bootstrapAdmin } from "@/services/vendor/setup-api";
import type { SetupStatusResponse } from "@/services/vendor/types";

/** Check platform setup status and bootstrap the first admin if needed. */
export function useSetup() {
  const [status, setStatus] = useState<SetupStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSetupStatus();
      setStatus(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not check setup status."));
    } finally {
      setLoading(false);
    }
  }, []);

  const bootstrap = useCallback(
    async (body: { email: string; password: string; name?: string }) => {
      if (!getApiBaseUrl()) return;
      setLoading(true);
      setError(null);
      try {
        await bootstrapAdmin(body);
        await check();
      } catch (e) {
        setError(httpErrorMessageForUser(e, "Could not bootstrap admin."));
      } finally {
        setLoading(false);
      }
    },
    [check]
  );

  return { status, loading, error, check, bootstrap };
}
