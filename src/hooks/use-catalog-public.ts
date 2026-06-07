"use client";

import { useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  listCatalogProducts,
  getCatalogProduct,
  compareCatalogProducts,
} from "@/services/vendor/catalog-api";
import type {
  CatalogProductSummary,
  CatalogProductDetail,
  CatalogProductCompareResponse,
} from "@/services/vendor/types";

/** Browse the public product catalog and compare products. */
export function useCatalogPublic() {
  const [products, setProducts] = useState<CatalogProductSummary[]>([]);
  const [productDetail, setProductDetail] = useState<CatalogProductDetail | null>(null);
  const [compareResult, setCompareResult] = useState<CatalogProductCompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (params?: {
      skip?: number;
      take?: number;
      categoryId?: string;
      shopSlug?: string;
      search?: string;
    }) => {
      if (!getApiBaseUrl()) return;
      setLoading(true);
      setError(null);
      try {
        const res = await listCatalogProducts(params);
        setProducts(res.items ?? []);
      } catch (e) {
        setError(httpErrorMessageForUser(e, "Could not load catalog."));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchDetail = useCallback(async (productId: string) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCatalogProduct(productId);
      setProductDetail(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load product detail."));
    } finally {
      setLoading(false);
    }
  }, []);

  const compare = useCallback(async (productIds: string[]) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await compareCatalogProducts({ productIds });
      setCompareResult(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not compare products."));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    products,
    productDetail,
    compareResult,
    loading,
    error,
    search,
    fetchDetail,
    compare,
  };
}
