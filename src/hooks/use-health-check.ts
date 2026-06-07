"use client";

import { useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  getGatewayHealth,
  getGatewayHealthLive,
  getGatewayHealthReady,
  getGatewayHealthCustomers,
  getGatewayHealthVendors,
  postHealthBeacon,
} from "@/services/vendor/health-api";
import type { HealthLiveResponse, HealthReadyResponse } from "@/services/vendor/types";

/** Diagnostic health checks for the vendor dashboard. */
export function useHealthCheck() {
  const [live, setLive] = useState<HealthLiveResponse | null>(null);
  const [ready, setReady] = useState<HealthReadyResponse | null>(null);
  const [full, setFull] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAll = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const [liveData, readyData, fullData] = await Promise.all([
        getGatewayHealthLive().catch(() => null),
        getGatewayHealthReady().catch(() => null),
        getGatewayHealth().catch(() => null),
      ]);
      setLive(liveData);
      setReady(readyData);
      setFull(fullData);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Health check failed."));
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPlatform = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        getGatewayHealthCustomers().catch(() => null),
        getGatewayHealthVendors().catch(() => null),
      ]);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Platform health check failed."));
    } finally {
      setLoading(false);
    }
  }, []);

  const beacon = useCallback(
    async (platform: string, appVersion: string, deviceId?: string) => {
      if (!getApiBaseUrl()) return;
      try {
        await postHealthBeacon({ platform, appVersion, deviceId });
      } catch {
        /* silent */
      }
    },
    []
  );

  return { live, ready, full, loading, error, checkAll, checkPlatform, beacon };
}
