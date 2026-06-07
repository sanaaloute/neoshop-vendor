"use client";

import { useState, useCallback, useEffect } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  getViewedProducts,
  postViewedProduct,
} from "@/services/vendor/users-api";
import type { ViewedProduct } from "@/services/vendor/types";

/** Track and list recently viewed products. */
export function useViewedProducts() {
  const [products, setProducts] = useState<ViewedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getViewedProducts();
      setProducts(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load viewed products."));
    } finally {
      setLoading(false);
    }
  }, []);

  const record = useCallback(async (productId: string) => {
    if (!getApiBaseUrl()) return;
    try {
      await postViewedProduct({ productId });
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { products, loading, error, refetch, record };
}
