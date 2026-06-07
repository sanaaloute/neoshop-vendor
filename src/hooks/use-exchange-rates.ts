"use client";

import { useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  getCurrentExchangeRate,
  convertExchangeRate,
} from "@/services/vendor/exchange-rates-api";
import type {
  ExchangeRateCurrentResponse,
  ExchangeRateConvertResponse,
} from "@/services/vendor/types";

/** Exposes current exchange-rate lookup and amount conversion. */
export function useExchangeRates() {
  const [currentRate, setCurrentRate] = useState<ExchangeRateCurrentResponse | null>(null);
  const [converted, setConverted] = useState<ExchangeRateConvertResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = useCallback(async (from: string, to: string) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCurrentExchangeRate({ from, to });
      setCurrentRate(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not fetch exchange rate."));
    } finally {
      setLoading(false);
    }
  }, []);

  const convert = useCallback(
    async (amount: number, fromCurrency: string, toCurrency: string) => {
      if (!getApiBaseUrl()) return;
      setLoading(true);
      setError(null);
      try {
        const data = await convertExchangeRate({
          amount,
          fromCurrency,
          toCurrency,
        });
        setConverted(data);
      } catch (e) {
        setError(
          httpErrorMessageForUser(e, "Could not convert currency.")
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { currentRate, converted, loading, error, fetchRate, convert };
}
