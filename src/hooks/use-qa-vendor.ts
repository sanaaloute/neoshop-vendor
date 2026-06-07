"use client";

import { useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { createProductQaQuestion } from "@/services/vendor/qa-api";
import type { QaThread } from "@/services/vendor/qa-api";

/** Ask questions about products (vendor-side Q&A participation). */
export function useQaVendor() {
  const [thread, setThread] = useState<QaThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(async (productId: string, question: string) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await createProductQaQuestion(productId, { question });
      setThread(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not post question."));
    } finally {
      setLoading(false);
    }
  }, []);

  return { thread, loading, error, ask };
}
