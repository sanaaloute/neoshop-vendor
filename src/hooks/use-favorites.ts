"use client";

import { useState, useCallback, useEffect } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  listFavoriteProducts,
  addFavoriteProduct,
  removeFavoriteProduct,
} from "@/services/vendor/favorites-api";

/** Manage the vendor's favorite products. */
export function useFavorites() {
  const [favorites, setFavorites] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listFavoriteProducts();
      setFavorites(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load favorites."));
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(
    async (productId: string) => {
      if (!getApiBaseUrl()) return;
      setLoading(true);
      setError(null);
      try {
        await addFavoriteProduct({ productId });
        await refetch();
      } catch (e) {
        setError(httpErrorMessageForUser(e, "Could not add favorite."));
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  const remove = useCallback(
    async (productId: string) => {
      if (!getApiBaseUrl()) return;
      setLoading(true);
      setError(null);
      try {
        await removeFavoriteProduct(productId);
        await refetch();
      } catch (e) {
        setError(httpErrorMessageForUser(e, "Could not remove favorite."));
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { favorites, loading, error, refetch, add, remove };
}
