"use client";

import { useState, useCallback, useEffect } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { getReferralMe, redeemReferral } from "@/services/vendor/referrals-api";
import type { ReferralMeResponse } from "@/services/vendor/types";

/** Loads and manages the current vendor's referral info. */
export function useReferrals() {
  const [referral, setReferral] = useState<ReferralMeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getReferralMe();
      setReferral(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load referral info."));
    } finally {
      setLoading(false);
    }
  }, []);

  const redeem = useCallback(async (code: string) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await redeemReferral({ code });
      setReferral(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not redeem referral code."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { referral, loading, error, refetch, redeem };
}
