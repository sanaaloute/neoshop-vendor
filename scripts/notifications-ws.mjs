/**
 * Minimal notifications push server for local development.
 * Usage: npm run notifications:ws
 * Set NEXT_PUBLIC_NOTIFICATIONS_WS_URL=ws://localhost:3457 in .env.local
 *
 * Broadcasts JSON: { "type": "notification", "payload": NotificationRecord }
 */

import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 3457);

const SAMPLE = [
  {
    title: "Shipment delayed",
    body: "Carrier reported weather delay — ETA +1 day.",
    category: "order",
    href: "/orders",
  },
  {
    title: "Tax doc ready",
    body: "January 1099-K summary is available.",
    category: "payout",
    href: "/payouts",
  },
  {
    title: "Policy reminder",
    body: "Listing compliance review scheduled for next week.",
    category: "system",
    href: "/shop",
  },
];

const wss = new WebSocketServer({ port: PORT });

function randomPayload() {
  const pick = SAMPLE[Math.floor(Math.random() * SAMPLE.length)] ?? SAMPLE[0];
  return {
    id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: pick.title,
    body: pick.body,
    category: pick.category,
    read: false,
    createdAt: new Date().toISOString(),
    href: pick.href,
  };
}

wss.on("connection", (ws) => {
  const timer = setInterval(() => {
    if (ws.readyState !== 1) return;
    ws.send(
      JSON.stringify({
        type: "notification",
        payload: randomPayload(),
      })
    );
  }, 42_000);

  ws.on("close", () => clearInterval(timer));
});

console.log(`Notifications WebSocket listening on ws://localhost:${PORT}`);
