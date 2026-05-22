"use client";

import { useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { mapApiProductDetailToVariantWorkbench } from "@/services/vendor/mappers/variants-from-api";
import { getProduct } from "@/services/vendor/products-api";
import { useVariantWorkbenchStore } from "@/store/variant-workbench-store";

export function useGatewayVariantsBootstrap(productId: string | null) {
  const replaceWorkbench = useVariantWorkbenchStore((s) => s.replaceWorkbench);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getApiBaseUrl() || !productId) {
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const raw = await getProduct(productId);
        const mapped = mapApiProductDetailToVariantWorkbench(
          raw as Record<string, unknown>
        );
        if (!cancelled) {
          replaceWorkbench({ productId, ...mapped });
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            httpErrorMessageForUser(e, "Could not load product variants.")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId, replaceWorkbench]);

  return { loading, error, enabled: Boolean(getApiBaseUrl() && productId) };
}
