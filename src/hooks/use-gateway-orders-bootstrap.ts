"use client";

import { useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { mapGatewayOrderToVendorOrder } from "@/services/vendor/mappers/orders-from-api";
import { listVendorOrders } from "@/services/vendor/orders-api";
import { useOrdersStore } from "@/store/orders-store";

/** Loads GET /orders/vendor when the gateway base URL is configured. */
export function useGatewayOrdersBootstrap() {
  const replaceOrders = useOrdersStore((s) => s.replaceOrders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getApiBaseUrl()) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listVendorOrders();
        const rows = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        const orders = rows.map((r) =>
          mapGatewayOrderToVendorOrder(r as Record<string, unknown>)
        );
        if (!cancelled) replaceOrders(orders);
      } catch (e) {
        if (!cancelled) {
          setError(httpErrorMessageForUser(e, "Could not load your orders."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [replaceOrders]);

  return { loading, error, enabled: Boolean(getApiBaseUrl()) };
}
