/**
 * Minimal vendor chat WebSocket relay for local development.
 * Usage: npm run chat:ws
 * Point NEXT_PUBLIC_VENDOR_CHAT_WS_URL=ws://localhost:3456 in .env.local
 *
 * Protocol (JSON):
 * - Client → server: { type: "join", threadId }
 * - Client → server: { type: "typing", threadId, role: "vendor", isTyping }
 * - Client → server: { type: "chat", threadId, message: ChatMessage }
 * - Server → clients: { type: "message", message }
 * - Server → clients: { type: "typing", threadId, isTyping, from: "vendor"|"customer" }
 */

import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 3456);

/** @type {Map<string, Set<import('ws').WebSocket>>} */
const rooms = new Map();

function roomAdd(threadId, ws) {
  if (!rooms.has(threadId)) rooms.set(threadId, new Set());
  rooms.get(threadId).add(ws);
}

function roomRemove(threadId, ws) {
  rooms.get(threadId)?.delete(ws);
}

function broadcastExcept(threadId, obj, except) {
  const set = rooms.get(threadId);
  if (!set) return;
  const raw = JSON.stringify(obj);
  for (const client of set) {
    if (client !== except && client.readyState === 1) client.send(raw);
  }
}

function broadcastAll(threadId, obj) {
  const set = rooms.get(threadId);
  if (!set) return;
  const raw = JSON.stringify(obj);
  for (const client of set) {
    if (client.readyState === 1) client.send(raw);
  }
}

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  let threadId = null;

  ws.on("message", (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (data.type === "join" && typeof data.threadId === "string") {
      if (threadId) roomRemove(threadId, ws);
      threadId = data.threadId;
      roomAdd(threadId, ws);
      return;
    }

    if (!threadId) return;

    if (data.type === "typing") {
      broadcastExcept(
        threadId,
        {
          type: "typing",
          threadId,
          isTyping: Boolean(data.isTyping),
          from: "vendor",
        },
        ws
      );
      return;
    }

    if (data.type === "chat" && data.message) {
      broadcastAll(threadId, { type: "message", message: data.message });

      setTimeout(() => {
        broadcastAll(threadId, {
          type: "typing",
          threadId,
          isTyping: true,
          from: "customer",
        });
        setTimeout(() => {
          broadcastAll(threadId, {
            type: "typing",
            threadId,
            isTyping: false,
            from: "customer",
          });
          const reply = {
            id: `srv-${Date.now()}`,
            threadId,
            authorRole: "customer",
            body: "Received — thanks for the update on our side.",
            sentAt: new Date().toISOString(),
          };
          broadcastAll(threadId, { type: "message", message: reply });
        }, 1400);
      }, 400);
    }
  });

  ws.on("close", () => {
    if (threadId) roomRemove(threadId, ws);
  });
});

console.log(`Vendor chat WebSocket listening on ws://localhost:${PORT}`);
