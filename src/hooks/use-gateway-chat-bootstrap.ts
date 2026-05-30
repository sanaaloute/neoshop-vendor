"use client";

import { useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  mapChatMessage,
  mapConversationToThread,
} from "@/services/vendor/mappers/chat-from-api";
import { listConversationMessages, listConversations } from "@/services/vendor/chat-api";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import { useVendorProfileStore } from "@/store/vendor-profile-store";

/** Loads GET /chat/conversations when the gateway and vendor session are available. */
export function useGatewayChatBootstrap() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const vendorId = useVendorProfileStore((s) => s.profile?.id ?? null);
  const replaceThreads = useChatStore((s) => s.replaceThreads);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUserIds = [userId, vendorId].filter((id): id is string => Boolean(id));

  useEffect(() => {
    if (!getApiBaseUrl()) {
      setLoading(false);
      setError(null);
      return;
    }
    if (currentUserIds.length === 0) {
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listConversations();
        const rawItems =
          (res as { items?: unknown[] })?.items ??
          (Array.isArray(res) ? res : []);
        const threads = (rawItems as Record<string, unknown>[]).map((row) =>
          mapConversationToThread(row, currentUserIds)
        );
        if (!cancelled) replaceThreads(threads);
      } catch (e) {
        if (!cancelled) {
          setError(
            httpErrorMessageForUser(e, "Could not load conversations.")
          );
          replaceThreads([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUserIds.join(","), replaceThreads]);

  return { loading, error, enabled: Boolean(getApiBaseUrl() && currentUserIds.length > 0) };
}

/** Loads messages for the active conversation from GET …/messages. */
export function useGatewayChatMessages(conversationId: string | null) {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const vendorId = useVendorProfileStore((s) => s.profile?.id ?? null);
  const mergeThreadMessages = useChatStore((s) => s.mergeThreadMessages);

  const currentUserIds = [userId, vendorId].filter((id): id is string => Boolean(id));

  useEffect(() => {
    if (!getApiBaseUrl() || currentUserIds.length === 0 || !conversationId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await listConversationMessages(conversationId, {
          take: 100,
        });
        const rawItems =
          (res as { items?: unknown[] })?.items ??
          (Array.isArray(res) ? res : []);
        const messages = (rawItems as Record<string, unknown>[])
          .map((m) => mapChatMessage(m, conversationId, currentUserIds))
          .sort((a, b) => +new Date(a.sentAt) - +new Date(b.sentAt));
        if (!cancelled) mergeThreadMessages(conversationId, messages);
      } catch {
        /* leave thread as-is */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, currentUserIds.join(","), mergeThreadMessages]);
}
