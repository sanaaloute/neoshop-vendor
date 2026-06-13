"use client";

import { useCallback, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  deleteConversationMessage,
  listConversationMessages,
  postConversationMessage,
} from "@/services/vendor/chat-api";

export function useChatMessages() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async <T>(fn: () => Promise<T>, fallbackMessage: string): Promise<T> => {
    if (!getApiBaseUrl()) throw new Error("gateway_not_configured");
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      const msg = httpErrorMessageForUser(e, fallbackMessage);
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = useCallback(
    async (conversationId: string, params?: { skip?: number; take?: number }) => {
      return run(
        () => listConversationMessages(conversationId, params),
        "Could not load messages."
      );
    },
    []
  );

  const sendMessage = useCallback(
    async (conversationId: string, body: string) => {
      return run(
        () => postConversationMessage(conversationId, { body }),
        "Could not send message."
      );
    },
    []
  );

  const deleteMessage = useCallback(
    async (conversationId: string, messageId: string) => {
      return run(
        () => deleteConversationMessage(conversationId, messageId),
        "Could not delete message."
      );
    },
    []
  );

  return {
    loading,
    error,
    fetchMessages,
    sendMessage,
    deleteMessage,
  };
}
