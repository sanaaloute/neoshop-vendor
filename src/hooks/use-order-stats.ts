"use client";

import { useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { getVendorOrderStats } from "@/services/vendor/orders-api";
import type { OrderStatsResponse } from "@/services/vendor/types";

/** Loads GET /orders/vendor/stats when the gateway base URL is configured. */
export function useOrderStats() {
  const [stats, setStats] = useState<OrderStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getVendorOrderStats();
      setStats(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load order stats."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refetch();
  }, []);

  return { stats, loading, error, refetch };
}
