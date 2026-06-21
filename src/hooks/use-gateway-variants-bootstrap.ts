"use client";

import { useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { mapApiProductDetailToVariantWorkbench } from "@/services/vendor/mappers/variants-from-api";
import { getProduct } from "@/services/vendor/products-api";
import { listVariants } from "@/services/vendor/variants-api";
import { useVariantWorkbenchStore } from "@/store/variant-workbench-store";

export function useGatewayVariantsBootstrap(productId: string | null) {
  const replaceWorkbench = useVariantWorkbenchStore((s) => s.replaceWorkbench);
  const resetWorkbench = useVariantWorkbenchStore((s) => s.resetWorkbench);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getApiBaseUrl() || !productId) {
      setLoading(false);
      setError(null);
      resetWorkbench();
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Load product detail (attributes) and the authoritative variant list
        // in parallel. The dedicated /variants endpoint is the source of truth
        // for variant rows, while /products/:id gives us attribute definitions.
        const [productRaw, variantsRaw] = await Promise.all([
          getProduct(productId),
          listVariants(productId),
        ]);

        const product = { ...((productRaw ?? {}) as Record<string, unknown>) };
        const variantItems = Array.isArray(variantsRaw)
          ? variantsRaw
          : Array.isArray((variantsRaw as Record<string, unknown>)?.items)
            ? ((variantsRaw as Record<string, unknown>).items as unknown[])
            : [];

        // Override the product's variants with the dedicated endpoint result.
        // Clone first to avoid mutating the object returned by getProduct.
        product.variants = variantItems;

        const mapped = mapApiProductDetailToVariantWorkbench(product);
        if (!cancelled) {
          replaceWorkbench({ productId, ...mapped });
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            httpErrorMessageForUser(e, "Could not load product variants.")
          );
          resetWorkbench();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId, replaceWorkbench, resetWorkbench]);

  return { loading, error, enabled: Boolean(getApiBaseUrl() && productId) };
}
