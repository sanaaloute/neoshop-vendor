"use client";

import { useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { mapApiProductDetailsToInventory } from "@/services/vendor/mappers/inventory-from-api";
import { getVariantInventory } from "@/services/vendor/inventory-api";
import { getProduct, listMyProducts } from "@/services/vendor/products-api";
import { useInventoryStore } from "@/store/inventory-store";

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
        const res = await listMyProducts({ take: 100 });
        const rows = Array.isArray(res?.items) ? res.items : [];
        const ids = rows
          .map((r) => String((r as Record<string, unknown>).id ?? ""))
          .filter(Boolean);
        const detailRows = await Promise.all(
          ids.map((id) => getProduct(id).catch(() => null))
        );
        const hydratedDetails = await Promise.all(
          detailRows.filter(Boolean).map(async (product) => {
            const detail = product as Record<string, unknown>;
            const variants = Array.isArray(detail.variants)
              ? detail.variants
              : [];
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
        const mapped = mapApiProductDetailsToInventory(
          hydratedDetails as Record<string, unknown>[]
        );
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
