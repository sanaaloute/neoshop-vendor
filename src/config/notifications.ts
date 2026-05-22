/** WebSocket URL for push notifications, e.g. `ws://localhost:3457`. */
export function getNotificationsWsUrl(): string | undefined {
  const u = process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL?.trim();
  return u || undefined;
}
