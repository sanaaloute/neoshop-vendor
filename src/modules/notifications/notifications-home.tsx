"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/cards/dashboard-card";
import { LoadingButton } from "@/components/feedback/loading-button";
import { getOrCreateDeviceId } from "@/lib/get-device-id";
import {
  getUnreadNotificationCount,
  listNotifications,
} from "@/services/vendor/notifications-api";
import { useNotificationsDevice } from "@/hooks/use-notifications-device";
import { useNotificationsStore } from "@/store/notifications-store";

import type { NotificationRecord } from "./types";
import { NotificationsPanel } from "./notifications-panel";

export function NotificationsHome() {
  const t = useTranslations("notifications");
  const loadItems = useNotificationsStore((s) => s.loadItems);
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);

  const { register, heartbeat, unregister, loading, error } =
    useNotificationsDevice();
  const [token, setToken] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    listNotifications({ take: 50 })
      .then((res) => {
        const rows: NotificationRecord[] = res.items.map((r) => ({
          id: r.id,
          title: r.title,
          body: r.body,
          category: r.category as NotificationRecord["category"],
          read: r.read,
          createdAt: r.createdAt,
          href: r.href ?? undefined,
        }));
        loadItems(rows);
      })
      .catch(() => {
        // silently fail; store remains empty
      });

    getUnreadNotificationCount()
      .then((res) => {
        setUnreadCount(res.count);
      })
      .catch(() => {
        // silently fail
      });
  }, [loadItems, setUnreadCount]);

  const handleRegister = async () => {
    setSuccess(null);
    const deviceToken = token ?? `web-${crypto.randomUUID()}`;
    if (!token) {
      setToken(deviceToken);
    }
    try {
      await register({
        token: deviceToken,
        platform: "web",
        deviceId: getOrCreateDeviceId(),
      });
      setRegistered(true);
      setSuccess(t("deviceRegistered"));
    } catch {
      // error is already surfaced by the hook
    }
  };

  const handleHeartbeat = async () => {
    if (!token) return;
    setSuccess(null);
    try {
      await heartbeat(token);
      setSuccess(t("deviceRegistered"));
    } catch {
      // error is already surfaced by the hook
    }
  };

  const handleUnregister = async () => {
    if (!token) return;
    setSuccess(null);
    try {
      await unregister(token);
      setRegistered(false);
      setSuccess(t("deviceUnregistered"));
    } catch {
      // error is already surfaced by the hook
    }
  };

  return (
    <div className="space-y-6">
      <NotificationsPanel
        variant="full"
        className="border-border/60 bg-card/40 shadow-vendor-card rounded-xl border p-4"
      />

      <DashboardCard>
        <DashboardCardHeader>
          <DashboardCardTitle>{t("deviceTokens")}</DashboardCardTitle>
          <DashboardCardDescription>
            {t("deviceTokensDescription")}
          </DashboardCardDescription>
        </DashboardCardHeader>
        <DashboardCardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <LoadingButton
              type="button"
              loading={loading}
              onClick={handleRegister}
              disabled={registered}
            >
              {t("registerDevice")}
            </LoadingButton>
            <LoadingButton
              type="button"
              variant="outline"
              loading={loading}
              onClick={handleHeartbeat}
              disabled={!registered}
            >
              {t("sendHeartbeat")}
            </LoadingButton>
            <LoadingButton
              type="button"
              variant="outline"
              loading={loading}
              onClick={handleUnregister}
              disabled={!registered}
            >
              {t("unregisterDevice")}
            </LoadingButton>
          </div>
          {token ? (
            <p className="text-muted-foreground text-xs break-all">
              <span className="font-medium">Token:</span> {token}
            </p>
          ) : null}
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          {success ? <p className="text-sm text-green-600">{success}</p> : null}
        </DashboardCardContent>
      </DashboardCard>
    </div>
  );
}
