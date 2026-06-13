"use client";

import { useCallback, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { listVariants } from "@/services/vendor/variants-api";

/** Load variants for a product via GET /products/:productId/variants. */
export function useVariants() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVariants = useCallback(async (productId: string) => {
    if (!getApiBaseUrl()) return [];
    setLoading(true);
    setError(null);
    try {
      const data = await listVariants(productId);
      return Array.isArray(data)
        ? data
        : Array.isArray((data as Record<string, unknown>)?.items)
          ? ((data as Record<string, unknown>).items as unknown[])
          : [];
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load variants."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, fetchVariants };
}
