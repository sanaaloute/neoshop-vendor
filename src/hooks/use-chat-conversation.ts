"use client";

import { useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  createConversation,
  getConversation,
} from "@/services/vendor/chat-api";

/** Create or retrieve a single chat conversation. */
export function useChatConversation() {
  const [conversation, setConversation] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (body: { withUserId?: string; withVendorId?: string }) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await createConversation(body);
      setConversation(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not create conversation."));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConversation = useCallback(async (conversationId: string) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getConversation(conversationId);
      setConversation(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load conversation."));
    } finally {
      setLoading(false);
    }
  }, []);

  return { conversation, loading, error, start, fetchConversation };
}
