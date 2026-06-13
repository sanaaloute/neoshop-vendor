"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  listVendorReviews,
  respondToReview,
} from "@/services/vendor/reviews-api";
import type { ReviewResponse, ReviewStatus } from "@/services/vendor/types";

export function useReviews() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (params?: { status?: ReviewStatus }) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listVendorReviews(params);
      setReviews(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load reviews."));
    } finally {
      setLoading(false);
    }
  }, []);

  const respond = useCallback(async (reviewId: string, response: string) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      await respondToReview(reviewId, { response });
      await refetch();
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not submit response."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [refetch]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    reviews,
    total,
    loading,
    error,
    refetch,
    respond,
  };
}
