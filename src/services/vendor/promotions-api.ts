import { vendorApiClient } from "@/services/api/client";

import type {
  CouponValidateRequest,
  CouponValidateResponse,
  PromotionActiveItem,
} from "./types";

/** POST /coupons/validate — validate a coupon code */
export async function validateCoupon(body: CouponValidateRequest) {
  const { data } = await vendorApiClient.post<CouponValidateResponse>(
    "/api/v1/coupons/validate",
    body
  );
  return data;
}

/** GET /promotions/active — list currently active promotions */
export async function listActivePromotions() {
  const { data } = await vendorApiClient.get<PromotionActiveItem[]>("/api/v1/promotions/active");
  return data;
}
