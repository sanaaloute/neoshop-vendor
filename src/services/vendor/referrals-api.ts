import { vendorApiClient } from "@/services/api/client";

import type { ReferralMeResponse, ReferralRedeemRequest } from "./types";

/** GET /referrals/me — get current user's referral info */
export async function getReferralMe() {
  const { data } = await vendorApiClient.get<ReferralMeResponse>("/api/v1/referrals/me");
  return data;
}

/** POST /referrals/redeem — redeem a referral code */
export async function redeemReferral(body: ReferralRedeemRequest) {
  const { data } = await vendorApiClient.post<ReferralMeResponse>("/api/v1/referrals/redeem", body);
  return data;
}
