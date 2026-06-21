"use client";

import { useCallback, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { getOrder, patchOrderStatus } from "@/services/vendor/orders-api";
import type { ApiOrderStatus } from "@/services/vendor/types";
import type { OrderStatus } from "@/modules/orders/types";
import { ORDER_STATUS_TRANSITIONS } from "@/modules/orders/types";

export function useOrderDetail() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async (orderId: string) => {
    if (!getApiBaseUrl()) return null;
    setLoading(true);
    setError(null);
    try {
      const data = await getOrder(orderId);
      return data;
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load order details."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(
    async (
      orderId: string,
      status: ApiOrderStatus,
      note?: string,
      currentStatus?: ApiOrderStatus
    ) => {
      if (!getApiBaseUrl()) return;
      // Enforce the normal vendor fulfillment flow on the client side.
      // The backend remains the final authority.
      if (currentStatus) {
        const allowed = new Set<ApiOrderStatus>([
          ...(ORDER_STATUS_TRANSITIONS[currentStatus as OrderStatus] ?? []),
        ]);
        if (!allowed.has(status)) {
          throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
        }
      }
      setLoading(true);
      setError(null);
      try {
        const data = await patchOrderStatus(orderId, { status, note });
        return data;
      } catch (e) {
        setError(httpErrorMessageForUser(e, "Could not update order status."));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    fetchOrder,
    updateStatus,
  };
}
