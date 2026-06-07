import { vendorApiClient } from "@/services/api/client";

import type {
  NotificationRecord,
  NotificationUnreadCountResponse,
  Paginated,
  RegisterDeviceDto,
} from "./types";

/** GET /notifications — list notifications */
export async function listNotifications(params?: {
  skip?: number;
  take?: number;
  unreadOnly?: boolean;
}) {
  const { data } = await vendorApiClient.get<Paginated<NotificationRecord>>("/api/v1/notifications", {
    params,
  });
  return data;
}

/** GET /notifications/unread-count */
export async function getUnreadNotificationCount() {
  const { data } = await vendorApiClient.get<NotificationUnreadCountResponse>("/api/v1/notifications/unread-count");
  return data;
}

/** PATCH /notifications/:notificationId — mark a notification as read/unread */
export async function patchNotification(
  notificationId: string,
  body: { read: boolean }
) {
  const { data } = await vendorApiClient.patch<NotificationRecord>(
    `/api/v1/notifications/${notificationId}`,
    body
  );
  return data;
}

/** POST /notifications/read-all — mark all notifications as read */
export async function markAllNotificationsRead() {
  const { data } = await vendorApiClient.post<{ ok: boolean }>("/api/v1/notifications/read-all", {});
  return data;
}

/** POST /notifications/devices/register — register a push device */
export async function registerNotificationDevice(body: RegisterDeviceDto) {
  const { data } = await vendorApiClient.post<{ ok: boolean }>("/api/v1/notifications/devices/register", body);
  return data;
}

/** POST /notifications/devices/:token/heartbeat — update device last-seen */
export async function heartbeatNotificationDevice(token: string) {
  const { data } = await vendorApiClient.post<{ ok: boolean }>(
    `/api/v1/notifications/devices/${encodeURIComponent(token)}/heartbeat`,
    {}
  );
  return data;
}

/** DELETE /notifications/devices/:token — unregister a push device */
export async function unregisterNotificationDevice(token: string) {
  await vendorApiClient.delete(`/api/v1/notifications/devices/${encodeURIComponent(token)}`);
}
