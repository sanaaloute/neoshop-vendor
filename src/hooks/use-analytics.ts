"use client";

import { useCallback, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  getVendorAnalyticsDashboard,
  getVendorAnalyticsInventory,
  getVendorAnalyticsOrders,
  getVendorAnalyticsProducts,
} from "@/services/vendor/analytics-gateway-api";
import type {
  AnalyticsDashboardResponse,
  AnalyticsInventoryItem,
  AnalyticsOrdersTrendItem,
  AnalyticsProductsItem,
} from "@/services/vendor/types";

export function useAnalytics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async <T>(fn: () => Promise<T>, fallbackMessage: string): Promise<T> => {
    if (!getApiBaseUrl()) throw new Error("gateway_not_configured");
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      const msg = httpErrorMessageForUser(e, fallbackMessage);
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = useCallback(async () => {
    return run(
      () => getVendorAnalyticsDashboard() as Promise<AnalyticsDashboardResponse>,
      "Could not load analytics dashboard."
    );
  }, []);

  const fetchOrdersTrend = useCallback(async (days?: number) => {
    return run(
      () => getVendorAnalyticsOrders({ days }) as Promise<AnalyticsOrdersTrendItem[]>,
      "Could not load order trends."
    );
  }, []);

  const fetchProducts = useCallback(async () => {
    return run(
      () => getVendorAnalyticsProducts() as Promise<AnalyticsProductsItem[]>,
      "Could not load product analytics."
    );
  }, []);

  const fetchInventory = useCallback(async (days?: number) => {
    return run(
      () => getVendorAnalyticsInventory({ days }) as Promise<{ items: AnalyticsInventoryItem[] }>,
      "Could not load inventory analytics."
    );
  }, []);

  return {
    loading,
    error,
    fetchDashboard,
    fetchOrdersTrend,
    fetchProducts,
    fetchInventory,
  };
}
