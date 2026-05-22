/** Full WebSocket URL, e.g. `ws://localhost:3456` or `wss://api.example.com/vendor/chat`. */
export function getVendorChatWsUrl(): string | undefined {
  const u = process.env.NEXT_PUBLIC_VENDOR_CHAT_WS_URL?.trim();
  return u || undefined;
}
