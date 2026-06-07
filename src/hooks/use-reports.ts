"use client";

import { useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { submitReport, listMyReports } from "@/services/vendor/reports-api";

/** Submit reports and list the vendor's own reports. */
export function useReports() {
  const [reports, setReports] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listMyReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load reports."));
    } finally {
      setLoading(false);
    }
  }, []);

  const submit = useCallback(
    async (body: {
      reportedUserId?: string;
      reportedVendorId?: string;
      category:
        | "harassment"
        | "fraud"
        | "spam"
        | "inappropriate_content"
        | "order_issue"
        | "other";
      details: string;
    }) => {
      if (!getApiBaseUrl()) return;
      setLoading(true);
      setError(null);
      try {
        await submitReport(body);
        await refetch();
      } catch (e) {
        setError(httpErrorMessageForUser(e, "Could not submit report."));
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  return { reports, loading, error, refetch, submit };
}
