"use client";

import { useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { getProductStats } from "@/services/vendor/products-api";
import type { ProductStatsResponse } from "@/services/vendor/types";

/** Loads GET /products/me/stats when the gateway base URL is configured. */
export function useProductStats() {
  const [stats, setStats] = useState<ProductStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProductStats();
      setStats(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load product stats."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refetch();
  }, []);

  return { stats, loading, error, refetch };
}
