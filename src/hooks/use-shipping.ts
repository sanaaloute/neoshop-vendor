"use client";

import { useEffect, useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  listShippingMethods,
  calculateShippingRates,
} from "@/services/vendor/shipping-api";
import type { ShippingMethod } from "@/services/vendor/shipping-api";

/** Loads available shipping methods and exposes a rate calculator. */
export function useShipping() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [methodsError, setMethodsError] = useState<string | null>(null);

  const [rates, setRates] = useState<
    Array<{
      methodId: string;
      methodName: string;
      cost: number;
      currency: string;
      estimatedDays: number;
    }>
  >([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  useEffect(() => {
    if (!getApiBaseUrl()) return;
    let cancelled = false;
    setMethodsLoading(true);
    setMethodsError(null);
    listShippingMethods()
      .then((data) => {
        if (!cancelled) setMethods(data);
      })
      .catch((e) => {
        if (!cancelled)
          setMethodsError(
            httpErrorMessageForUser(e, "Could not load shipping methods.")
          );
      })
      .finally(() => {
        if (!cancelled) setMethodsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchRates = useCallback(
    async (body: {
      addressId?: string;
      items: { variantId: string; quantity: number }[];
    }) => {
      if (!getApiBaseUrl()) return;
      setRatesLoading(true);
      setRatesError(null);
      try {
        const data = await calculateShippingRates(body);
        setRates(data);
      } catch (e) {
        setRatesError(
          httpErrorMessageForUser(e, "Could not calculate shipping rates.")
        );
      } finally {
        setRatesLoading(false);
      }
    },
    []
  );

  return {
    methods,
    methodsLoading,
    methodsError,
    rates,
    ratesLoading,
    ratesError,
    fetchRates,
  };
}
