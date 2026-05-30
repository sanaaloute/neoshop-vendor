/**
 * Socket.IO server URL (HTTP/S — client upgrades to WebSocket).
 * Uses the public Kong gateway URL so all traffic is proxied correctly.
 * Falls back to NEXT_PUBLIC_API_BASE_URL when NEXT_PUBLIC_SOCKET_IO_URL is unset.
 */
export function getSocketIoUrl(): string | undefined {
  const u = process.env.NEXT_PUBLIC_SOCKET_IO_URL?.trim();
  if (u) return u;
  const api = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return api || undefined;
}

/**
 * Socket.IO path — must match the Kong route + backend REALTIME_SOCKET_PATH.
 * Defaults to `/socket.io`.
 */
export function getSocketIoPath(): string {
  return process.env.NEXT_PUBLIC_SOCKET_IO_PATH?.trim() || "/socket.io";
}
