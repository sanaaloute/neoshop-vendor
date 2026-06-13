"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  getVendorDispute,
  listVendorDisputes,
  postDisputeMessage,
} from "@/services/vendor/disputes-api";
import type {
  DisputeDetail,
  DisputeSummary,
  PostDisputeMessageDto,
} from "@/services/vendor/types";

export function useDisputes() {
  const [disputes, setDisputes] = useState<DisputeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listVendorDisputes();
      setDisputes(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load disputes."));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (disputeId: string) => {
    if (!getApiBaseUrl()) return null;
    setLoading(true);
    setError(null);
    try {
      const data = await getVendorDispute(disputeId);
      return data as DisputeDetail;
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load dispute details."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const postMessage = useCallback(
    async (disputeId: string, body: PostDisputeMessageDto) => {
      if (!getApiBaseUrl()) return;
      setLoading(true);
      setError(null);
      try {
        await postDisputeMessage(disputeId, body);
        await refetch();
      } catch (e) {
        setError(httpErrorMessageForUser(e, "Could not post message."));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    disputes,
    total,
    loading,
    error,
    refetch,
    fetchDetail,
    postMessage,
  };
}
