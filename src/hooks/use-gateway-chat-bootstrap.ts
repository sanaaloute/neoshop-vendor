"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

/** Loads GET /chat/conversations when the gateway and vendor session are available.
 *  Auto-refreshes every 15s as a fallback when Socket.IO is offline. */
export function useGatewayChatBootstrap() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const vendorId = useVendorProfileStore((s) => s.profile?.id ?? null);
  const replaceThreads = useChatStore((s) => s.replaceThreads);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUserIds = [userId, vendorId].filter((id): id is string => Boolean(id));

  const load = useCallback(async () => {
    if (!getApiBaseUrl() || currentUserIds.length === 0) return;
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
      replaceThreads(threads);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load conversations."));
      replaceThreads([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserIds.join(","), replaceThreads]);

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
          setError(httpErrorMessageForUser(e, "Could not load conversations."));
          replaceThreads([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // Auto-refresh every 15s as fallback when Socket.IO is offline
    const interval = setInterval(() => {
      if (cancelled) return;
      (async () => {
        try {
          const res = await listConversations();
          const rawItems =
            (res as { items?: unknown[] })?.items ??
            (Array.isArray(res) ? res : []);
          const threads = (rawItems as Record<string, unknown>[]).map((row) =>
            mapConversationToThread(row, currentUserIds)
          );
          if (!cancelled) replaceThreads(threads);
        } catch {
          /* silently fail on background refresh */
        }
      })();
    }, 15_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUserIds.join(","), replaceThreads]);

  return { loading, error, enabled: Boolean(getApiBaseUrl() && currentUserIds.length > 0), refresh: load };
}

/** Loads messages for the active conversation from GET …/messages.
 *  Auto-refreshes every 5s as a fallback when Socket.IO is offline. */
export function useGatewayChatMessages(conversationId: string | null) {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const vendorId = useVendorProfileStore((s) => s.profile?.id ?? null);
  const mergeThreadMessages = useChatStore((s) => s.mergeThreadMessages);
  const threads = useChatStore((s) => s.threads);

  const baseIds = [userId, vendorId].filter((id): id is string => Boolean(id));
  // Augment with vendorChatId discovered from the thread, if present
  const threadVendorId = threads.find((t) => t.id === conversationId)?.vendorChatId;
  const currentUserIds = threadVendorId
    ? Array.from(new Set([...baseIds, threadVendorId]))
    : baseIds;

  useEffect(() => {
    if (!getApiBaseUrl() || currentUserIds.length === 0 || !conversationId) return;

    let cancelled = false;
    const load = async () => {
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
    };

    void load();

    // Auto-refresh every 5s as fallback when Socket.IO is offline
    const interval = setInterval(() => {
      if (!cancelled) void load();
    }, 5_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId, currentUserIds.join(","), mergeThreadMessages]);
}
