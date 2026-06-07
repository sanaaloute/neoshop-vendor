"use client";

import { useState, useCallback, useEffect } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  listPaymentMethods,
  captureOrderPayment,
} from "@/services/vendor/payments-api";
import type { PaymentMethod, CapturePaymentDto } from "@/services/vendor/types";

/** Loads payment methods and exposes manual payment capture. */
export function usePayments() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listPaymentMethods();
      setMethods(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load payment methods."));
    } finally {
      setLoading(false);
    }
  }, []);

  const capture = useCallback(async (orderId: string, body: CapturePaymentDto) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      await captureOrderPayment(orderId, body);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not capture payment."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { methods, loading, error, refetch, capture };
}
