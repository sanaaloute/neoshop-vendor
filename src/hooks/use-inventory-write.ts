"use client";

import { useCallback, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  adjustVariantQuantity,
  setVariantQuantity,
} from "@/services/vendor/inventory-api";

export function useInventoryWrite() {
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

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    return run(
      () => setVariantQuantity(variantId, { quantity }),
      "Could not set inventory quantity."
    );
  }, []);

  const adjustQuantity = useCallback((variantId: string, delta: number) => {
    return run(
      () => adjustVariantQuantity(variantId, { delta }),
      "Could not adjust inventory quantity."
    );
  }, []);

  return {
    loading,
    error,
    setQuantity,
    adjustQuantity,
  };
}
