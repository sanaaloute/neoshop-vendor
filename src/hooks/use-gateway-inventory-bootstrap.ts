"use client";

import { useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { mapApiProductDetailsToInventory } from "@/services/vendor/mappers/inventory-from-api";
import { getVariantInventory } from "@/services/vendor/inventory-api";
import { getProduct, listMyProducts } from "@/services/vendor/products-api";
import { useInventoryStore } from "@/store/inventory-store";

const PRODUCT_TAKE = 24;
const MAX_VARIANT_INVENTORY_LOOKUPS = 50;

export function useGatewayInventoryBootstrap() {
  const replaceInventory = useInventoryStore((s) => s.replaceInventory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getApiBaseUrl()) {
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch a limited page of products to avoid overwhelming the backend
        // with N+1 inventory lookups. The inventory page is meant for oversight;
        // detailed per-variant stock can be refreshed on demand.
        const res = await listMyProducts({ take: PRODUCT_TAKE });
        const rows = Array.isArray(res?.items) ? res.items : [];
        const ids = rows
          .map((r) => String((r as Record<string, unknown>).id ?? ""))
          .filter(Boolean);
        const detailRows = await Promise.all(
          ids.map((id) => getProduct(id).catch(() => null))
        );

        const products = detailRows.filter(Boolean) as Record<string, unknown>[];
        const allVariantIds = products.flatMap((detail) => {
          const variants = Array.isArray(detail.variants) ? detail.variants : [];
          return variants
            .map((rawVariant) => String((rawVariant as Record<string, unknown>).id ?? ""))
            .filter(Boolean);
        });

        // Guard against pathological N+1: if there are too many variants, skip
        // per-variant inventory bootstrap and rely on real-time events / manual refresh.
        const shouldFetchInventory =
          allVariantIds.length > 0 &&
          allVariantIds.length <= MAX_VARIANT_INVENTORY_LOOKUPS;

        const hydratedDetails = await Promise.all(
          products.map(async (detail) => {
            const variants = Array.isArray(detail.variants)
              ? detail.variants
              : [];
            if (!shouldFetchInventory) {
              return detail;
            }
            const nextVariants = await Promise.all(
              variants.map(async (rawVariant) => {
                const variant = rawVariant as Record<string, unknown>;
                const variantId = String(variant.id ?? "");
                if (!variantId) return variant;
                const inventory = await getVariantInventory(variantId).catch(
                  () => variant.inventory
                );
                return { ...variant, inventory };
              })
            );
            return { ...detail, variants: nextVariants };
          })
        );
        const mapped = mapApiProductDetailsToInventory(hydratedDetails);
        if (!cancelled) replaceInventory(mapped);
      } catch (e) {
        if (!cancelled) {
          setError(
            httpErrorMessageForUser(e, "Could not load inventory from gateway.")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [replaceInventory]);

  return { loading, error, enabled: Boolean(getApiBaseUrl()) };
}
