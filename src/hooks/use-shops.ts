"use client";

import { useState, useCallback, useEffect } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  listMyShops,
  createShop,
  updateShop,
  getShopPublicBySlug,
} from "@/services/vendor/shops-api";
import type { CreateShopDto, UpdateShopDto } from "@/services/vendor/types";

export type ShopItem = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  isPublished?: boolean;
};

export type PublicShopProfile = {
  slug: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
};

/** Loads the vendor's shops and exposes create / update / public-preview. */
export function useShops() {
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [publicProfile, setPublicProfile] = useState<PublicShopProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listMyShops();
      const items = Array.isArray(data) ? data : [];
      setShops(items as ShopItem[]);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load shops."));
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(
    async (body: CreateShopDto) => {
      if (!getApiBaseUrl()) return null;
      setLoading(true);
      setError(null);
      try {
        const data = await createShop(body);
        await refetch();
        return data as ShopItem;
      } catch (e) {
        setError(httpErrorMessageForUser(e, "Could not create shop."));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  const update = useCallback(
    async (shopId: string, body: UpdateShopDto) => {
      if (!getApiBaseUrl()) return null;
      setLoading(true);
      setError(null);
      try {
        const data = await updateShop(shopId, body);
        await refetch();
        return data as ShopItem;
      } catch (e) {
        setError(httpErrorMessageForUser(e, "Could not update shop."));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  const previewPublic = useCallback(async (slug: string) => {
    if (!getApiBaseUrl()) return null;
    setLoading(true);
    setError(null);
    try {
      const data = await getShopPublicBySlug(slug);
      setPublicProfile(data as PublicShopProfile);
      return data as PublicShopProfile;
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load public shop preview."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    shops,
    publicProfile,
    loading,
    error,
    refetch,
    create,
    update,
    previewPublic,
  };
}
