"use client";

import { useEffect } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { listMyShops } from "@/services/vendor/shops-api";
import { useShopSettingsStore } from "@/store/shop-settings-store";
import type {
  PayoutSettings,
  ReturnPolicy,
  ShippingRules,
} from "@/modules/shop/types";

function objectValue(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

function numberValue(v: unknown, fallback: number) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function stringValue(v: unknown, fallback: string) {
  return typeof v === "string" ? v : fallback;
}

function booleanValue(v: unknown, fallback: boolean) {
  return typeof v === "boolean" ? v : fallback;
}

/** Hydrates shop settings from GET /shops/me when possible. */
export function useShopGatewayBootstrap() {
  const patch = useShopSettingsStore((s) => s.patch);

  useEffect(() => {
    if (!getApiBaseUrl()) return;

    let cancelled = false;
    (async () => {
      try {
        const shops = await listMyShops();
        const list = Array.isArray(shops) ? shops : [];
        const row = list[0] as Record<string, unknown> | undefined;
        if (!row || cancelled) return;
        const cur = useShopSettingsStore.getState().data;
        const shippingConfig = objectValue(row.shippingConfig);
        const paymentConfig = objectValue(row.paymentConfig);
        const returnPolicy = objectValue(shippingConfig.returnPolicy);
        const shipping: ShippingRules = {
          ...cur.shipping,
          processingDaysMin: numberValue(
            shippingConfig.processingDaysMin,
            cur.shipping.processingDaysMin
          ),
          processingDaysMax: numberValue(
            shippingConfig.processingDaysMax,
            cur.shipping.processingDaysMax
          ),
          freeShippingThresholdUsd: stringValue(
            shippingConfig.freeShippingThresholdUsd,
            cur.shipping.freeShippingThresholdUsd
          ),
          carriersNote: stringValue(
            shippingConfig.carriersNote,
            cur.shipping.carriersNote
          ),
        };
        const nextReturnPolicy: ReturnPolicy = {
          ...cur.returnPolicy,
          windowDays: numberValue(
            returnPolicy.windowDays,
            cur.returnPolicy.windowDays
          ),
          restockingFeePercent: numberValue(
            returnPolicy.restockingFeePercent,
            cur.returnPolicy.restockingFeePercent
          ),
          details: stringValue(returnPolicy.details, cur.returnPolicy.details),
        };
        const payout: PayoutSettings = {
          ...cur.payout,
          frequency:
            paymentConfig.frequency === "weekly" ||
            paymentConfig.frequency === "biweekly" ||
            paymentConfig.frequency === "monthly"
              ? paymentConfig.frequency
              : cur.payout.frequency,
          minimumPayoutUsd: stringValue(
            paymentConfig.minimumPayoutUsd,
            cur.payout.minimumPayoutUsd
          ),
          taxFormOnFile: booleanValue(
            paymentConfig.taxFormOnFile,
            cur.payout.taxFormOnFile
          ),
        };
        patch({
          profile: {
            ...cur.profile,
            shopName: String(row.name ?? cur.profile.shopName),
            slug: String(row.slug ?? cur.profile.slug),
            description: String(row.description ?? cur.profile.description),
          },
          branding: {
            ...cur.branding,
            logoDataUrl:
              typeof row.logoUrl === "string"
                ? row.logoUrl
                : cur.branding.logoDataUrl,
            bannerDataUrl:
              typeof row.bannerUrl === "string"
                ? row.bannerUrl
                : cur.branding.bannerDataUrl,
          },
          shipping,
          returnPolicy: nextReturnPolicy,
          payout,
        });
      } catch {
        /* keep local draft */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [patch]);
}
