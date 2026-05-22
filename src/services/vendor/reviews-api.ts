import { vendorApiClient } from "@/services/api/client";

import type { Paginated, RespondToReviewDto, ReviewResponse, ReviewStatus } from "./types";

/** GET /vendors/me/reviews — list reviews on products owned by this vendor */
export async function listVendorReviews(params?: {
  page?: number;
  limit?: number;
  status?: ReviewStatus;
}) {
  const { data } = await vendorApiClient.get<Paginated<ReviewResponse>>(
    "/api/v1/vendors/me/reviews",
    { params }
  );
  return data;
}

/** POST /vendors/me/reviews/:reviewId/response — respond to a review as the vendor */
export async function respondToReview(reviewId: string, body: RespondToReviewDto) {
  const { data } = await vendorApiClient.post<ReviewResponse>(
    `/api/v1/vendors/me/reviews/${reviewId}/response`,
    body
  );
  return data;
}
