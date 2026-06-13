"use client";

import { useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  answerQaThread,
  createProductQaQuestion,
  listProductQa,
} from "@/services/vendor/qa-api";
import type { CreateQaAnswerDto, QaThread } from "@/services/vendor/qa-api";

/** Vendor-side Q&A participation: list threads, ask questions, post answers. */
export function useQaVendor() {
  const [thread, setThread] = useState<QaThread | null>(null);
  const [threads, setThreads] = useState<QaThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async (productId: string) => {
    if (!getApiBaseUrl()) return [];
    setLoading(true);
    setError(null);
    try {
      const data = await listProductQa(productId);
      setThreads(data);
      return data;
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load Q&A threads."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const ask = useCallback(async (productId: string, question: string) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await createProductQaQuestion(productId, { question });
      setThread(data);
      return data;
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not post question."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const answer = useCallback(async (threadId: string, body: CreateQaAnswerDto) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await answerQaThread(threadId, body);
      return data;
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not post answer."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { thread, threads, loading, error, list, ask, answer };
}
