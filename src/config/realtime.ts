/**
 * Socket.IO server URL (HTTP/S — client upgrades to WebSocket).
 * Example: `http://localhost:3001` or `https://ws.neoshop.example`
 */
export function getSocketIoUrl(): string | undefined {
  const u = process.env.NEXT_PUBLIC_SOCKET_IO_URL?.trim();
  return u || undefined;
}
