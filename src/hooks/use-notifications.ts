"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  patchNotification,
} from "@/services/vendor/notifications-api";
import type { NotificationRecord } from "@/services/vendor/types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (params?: { unreadOnly?: boolean }) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const [listData, countData] = await Promise.all([
        listNotifications(params),
        getUnreadNotificationCount(),
      ]);
      setNotifications(listData.items);
      setTotal(listData.total);
      setUnreadCount(countData.count);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load notifications."));
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (notificationId: string, read: boolean) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      await patchNotification(notificationId, { read });
      await refetch();
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not update notification."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [refetch]);

  const markAllRead = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      await markAllNotificationsRead();
      await refetch();
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not mark all notifications read."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [refetch]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    notifications,
    unreadCount,
    total,
    loading,
    error,
    refetch,
    markRead,
    markAllRead,
  };
}
