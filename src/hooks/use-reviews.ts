"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  listVendorReviews,
  respondToReview,
} from "@/services/vendor/reviews-api";
import type { ReviewResponse, ReviewStatus } from "@/services/vendor/types";

const DEFAULT_TAKE = 20;

export type ReviewsParams = {
  skip?: number;
  take?: number;
  status?: ReviewStatus;
};

export function useReviews() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [params, setParams] = useState<ReviewsParams>({
    skip: 0,
    take: DEFAULT_TAKE,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (overrides?: ReviewsParams) => {
    if (!getApiBaseUrl()) return;
    const next = overrides ? { ...params, ...overrides } : params;
    setParams(next);
    setLoading(true);
    setError(null);
    try {
      const data = await listVendorReviews(next);
      setReviews(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load reviews."));
    } finally {
      setLoading(false);
    }
  }, [params]);

  const setPage = useCallback(
    (page: number) => {
      const take = params.take ?? DEFAULT_TAKE;
      void refetch({ skip: page * take, take });
    },
    [params.take, refetch]
  );

  const setStatus = useCallback(
    (status: ReviewStatus | undefined) => {
      void refetch({ skip: 0, status });
    },
    [refetch]
  );

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    reviews,
    total,
    params,
    loading,
    error,
    refetch,
    respond,
    setPage,
    setStatus,
  };
}
