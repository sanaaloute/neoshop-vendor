"use client";

import { useCallback, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  deleteConversationMessage,
  listConversationMessages,
  postConversationMessage,
  uploadChatAttachment,
  type ChatMessageAttachmentInput,
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
    async (
      conversationId: string,
      body: string | undefined,
      attachments?: ChatMessageAttachmentInput[]
    ) => {
      return run(
        () => postConversationMessage(conversationId, { body, attachments }),
        "Could not send message."
      );
    },
    []
  );

  const uploadAttachment = useCallback(
    async (conversationId: string, file: File) => {
      return run(
        () => uploadChatAttachment(conversationId, file),
        "Could not upload attachment."
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
    uploadAttachment,
    deleteMessage,
  };
}
