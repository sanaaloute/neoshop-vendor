"use client";

import { useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { mapApiProductRowToProduct } from "@/services/vendor/mappers/catalog-from-api";
import { getCategoryTree } from "@/services/vendor/categories-api";
import { listMyProducts } from "@/services/vendor/products-api";
import { useCategoriesStore } from "@/store/categories-store";
import { useProductCatalogStore } from "@/store/product-catalog-store";

/** Loads GET /products/me when `NEXT_PUBLIC_API_BASE_URL` is set and replaces the catalog store. */
export function useGatewayCatalogBootstrap() {
  const replaceCatalog = useProductCatalogStore((s) => s.replaceCatalog);
  const setCategories = useCategoriesStore((s) => s.setCategories);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getApiBaseUrl()) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [res, cats] = await Promise.all([
          listMyProducts({ take: 100 }),
          getCategoryTree().catch(() => []),
        ]);
        const rows = Array.isArray(res?.items) ? res.items : [];
        const products = rows.map((r) =>
          mapApiProductRowToProduct(r as Record<string, unknown>)
        );
        if (!cancelled) {
          replaceCatalog(products);
          setCategories(Array.isArray(cats) ? cats : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            httpErrorMessageForUser(e, "Could not load your products.")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [replaceCatalog, setCategories]);

  return { loading, error, enabled: Boolean(getApiBaseUrl()) };
}
