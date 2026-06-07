"use client";

import { useState, useCallback, useEffect } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { validateCoupon, listActivePromotions } from "@/services/vendor/promotions-api";
import type {
  CouponValidateResponse,
  PromotionActiveItem,
} from "@/services/vendor/types";

/** Loads active promotions and exposes coupon validation. */
export function usePromotions() {
  const [promotions, setPromotions] = useState<PromotionActiveItem[]>([]);
  const [validationResult, setValidationResult] = useState<CouponValidateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listActivePromotions();
      setPromotions(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load promotions."));
    } finally {
      setLoading(false);
    }
  }, []);

  const validate = useCallback(async (code: string, cartId?: string) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await validateCoupon({ code, cartId });
      setValidationResult(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not validate coupon."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { promotions, validationResult, loading, error, refetch, validate };
}
