"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { getDefaultShopSettings } from "@/modules/shop/defaults";
import type { ShopSettingsState } from "@/modules/shop/types";

const MAX_IMAGE_CHARS = 180_000;

function mergeSettings(
  base: ShopSettingsState,
  partial: Partial<ShopSettingsState>
): ShopSettingsState {
  return {
    profile: { ...base.profile, ...partial.profile },
    branding: { ...base.branding, ...partial.branding },
    shipping: { ...base.shipping, ...partial.shipping },
    returnPolicy: { ...base.returnPolicy, ...partial.returnPolicy },
    business: { ...base.business, ...partial.business },
    verification: { ...base.verification, ...partial.verification },
    payout: { ...base.payout, ...partial.payout },
  };
}

function trimImagesForStorage(s: ShopSettingsState): ShopSettingsState {
  return {
    ...s,
    branding: {
      ...s.branding,
      logoDataUrl:
        s.branding.logoDataUrl &&
        s.branding.logoDataUrl.length <= MAX_IMAGE_CHARS
          ? s.branding.logoDataUrl
          : s.branding.logoDataUrl
            ? null
            : s.branding.logoDataUrl,
      bannerDataUrl:
        s.branding.bannerDataUrl &&
        s.branding.bannerDataUrl.length <= MAX_IMAGE_CHARS
          ? s.branding.bannerDataUrl
          : s.branding.bannerDataUrl
            ? null
            : s.branding.bannerDataUrl,
    },
  };
}

type ShopSettingsStoreState = {
  data: ShopSettingsState;
  patch: (partial: Partial<ShopSettingsState>) => void;
  reset: () => void;
};

export const useShopSettingsStore = create<ShopSettingsStoreState>()(
  persist(
    (set) => ({
      data: getDefaultShopSettings(),
      patch: (partial) =>
        set((s) => ({ data: mergeSettings(s.data, partial) })),
      reset: () => set({ data: getDefaultShopSettings() }),
    }),
    {
      name: "neoshop-vendor-shop-settings-v1",
      version: 1,
      partialize: (s) => ({ data: trimImagesForStorage(s.data) }),
    }
  )
);

/** Avoid flashing defaults before localStorage rehydrates (client-only). */
export function useShopSettingsHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const p = useShopSettingsStore.persist;
    if (!p?.hasHydrated) {
      setHydrated(true);
      return;
    }
    setHydrated(p.hasHydrated());
    return p.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}
