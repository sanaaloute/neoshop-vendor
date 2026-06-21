/**
 * Minimal vendor chat WebSocket relay for local development ONLY.
 * Usage: npm run chat:ws
 * Point NEXT_PUBLIC_VENDOR_CHAT_WS_URL=ws://localhost:3456 in .env.local
 *
 * ⚠️ This relay has no signature verification and is intended purely for local
 * development. Never expose it to a network or production environment.
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

/**
 * Decode a JWT payload without verifying the signature.
 * This is intentionally weak (dev-only) and only checks shape/expiry/role.
 */
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return payload;
  } catch {
    return null;
  }
}

function isLocalAddress(addr) {
  return (
    addr === "127.0.0.1" ||
    addr === "::1" ||
    addr === "::ffff:127.0.0.1"
  );
}

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws, req) => {
  // Localhost-only development guard.
  const remoteAddress = req.socket.remoteAddress ?? "";
  if (!isLocalAddress(remoteAddress)) {
    console.warn(`Rejected non-local chat WS connection from ${remoteAddress}`);
    ws.close(1008, "localhost_only");
    return;
  }

  // Best-effort token presence check. We cannot verify the signature here
  // without the Supabase JWT secret, but we can reject missing/badly-shaped
  // tokens and enforce a vendor role claim.
  const url = new URL(req.url ?? "/", "http://localhost");
  const token = url.searchParams.get("token");
  const payload = token ? decodeJwtPayload(token) : null;
  if (!payload) {
    console.warn("Rejected chat WS connection without a decodable token");
    ws.close(1008, "auth_required");
    return;
  }
  const exp = typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  if (exp && Date.now() >= exp) {
    console.warn("Rejected chat WS connection with expired token");
    ws.close(1008, "token_expired");
    return;
  }
  const role = payload.role ?? "";
  const userRole = payload.user_role ?? "";
  if (role !== "vendor" && userRole !== "vendor") {
    console.warn("Rejected chat WS connection: role is not vendor");
    ws.close(1008, "role_forbidden");
    return;
  }

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
console.log("WARNING: This is a local-development relay with no signature verification.");
console.log("Never expose this server to a network or use it in production.");
