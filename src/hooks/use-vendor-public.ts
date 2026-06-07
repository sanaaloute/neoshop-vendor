"use client";

import { useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  listPublicVendors,
  getPublicVendor,
} from "@/services/vendor/vendor-public-api";
import type { VendorPublicSummary, VendorPublicProfile } from "@/services/vendor/types";

/** Discover public vendors and view public vendor profiles. */
export function useVendorPublic() {
  const [vendors, setVendors] = useState<VendorPublicSummary[]>([]);
  const [profile, setProfile] = useState<VendorPublicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params?: { skip?: number; take?: number; search?: string }) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listPublicVendors(params);
      setVendors(res.items ?? []);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load vendors."));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async (vendorId: string) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicVendor(vendorId);
      setProfile(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load vendor profile."));
    } finally {
      setLoading(false);
    }
  }, []);

  return { vendors, profile, loading, error, search, fetchProfile };
}
