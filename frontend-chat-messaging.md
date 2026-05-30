# Frontend Chat Messaging Integration

This document describes how the direct-chat module works for **Customer**, **Vendor**, and **Admin** frontends.

## Base URL

All endpoints are under:

```
/api/v1/chat
```

All endpoints require a valid JWT access token (`Authorization: Bearer <token>`).

---

## Role-Based Conversation Rules

Who is allowed to **start** a new conversation:

| Initiator | Can start with | Cannot start with |
|-----------|---------------|-------------------|
| **Customer** | Vendor, Admin | Another customer |
| **Admin** | Vendor, Customer | Another admin |
| **Vendor** | Admin only | Customer, Another vendor |

Who is allowed to **reply** inside an existing conversation:

- Once a conversation exists and you are a participant, you can send messages normally.
- **Exception — Vendor → Customer:** A vendor may **not** send the first message in a customer-vendor conversation. The customer must send at least one message first. After that, the vendor can reply freely.

---

## Endpoints

### 1. Open or resume a conversation

```http
POST /api/v1/chat/conversations
```

**Body:**
```json
{
  "withUserId": "<uuid-of-peer-user>"
}
```

**Behavior:**
- If a two-participant conversation already exists between you and `withUserId`, it returns that conversation.
- Otherwise, it creates a new conversation and adds both users as participants.
- Enforces role-based initiation rules (see table above). Returns `403 Forbidden` if you are not allowed to start a conversation with that user.

**Example flows:**
- A customer sends `withUserId` of a vendor → ✅ success.
- A vendor sends `withUserId` of a customer → ❌ `403 Forbidden`.
- A vendor sends `withUserId` of an admin → ✅ success.

---

### 2. List my conversations

```http
GET /api/v1/chat/conversations
```

**Response:**
```json
{
  "items": [
    {
      "id": "<conversation-uuid>",
      "createdAt": "...",
      "updatedAt": "...",
      "participants": [
        {
          "userId": "...",
          "joinedAt": "...",
          "user": {
            "id": "...",
            "email": "...",
            "role": "customer"
          }
        }
      ],
      "messages": [
        {
          "id": "...",
          "body": "...",
          "senderUserId": "...",
          "createdAt": "..."
        }
      ]
    }
  ]
}
```

**Notes:**
- Sorted by `updatedAt` descending (most recently active first).
- The `messages` array contains only the **latest message** per conversation (for preview).
- Deleted messages are hidden from this list.

---

### 3. Get conversation details

```http
GET /api/v1/chat/conversations/:conversationId
```

**Response:** Conversation metadata including the full participants list.

---

### 4. List messages in a conversation

```http
GET /api/v1/chat/conversations/:conversationId/messages?skip=0&take=50
```

**Response:**
```json
{
  "items": [
    {
      "id": "<message-uuid>",
      "senderUserId": "<user-uuid>",
      "body": "Hello, is this available?",
      "createdAt": "2026-05-30T10:00:00.000Z"
    }
  ],
  "total": 120,
  "skip": 0,
  "take": 50
}
```

**Notes:**
- Ordered newest first.
- `take` max is `100`.
- Deleted messages are **not** returned.

---

### 5. Send a message

```http
POST /api/v1/chat/conversations/:conversationId/messages
```

**Body:**
```json
{
  "body": "Hello, is this available?"
}
```

**Validation:**
- `body` is required, 1–4000 characters.
- You must be a participant in the conversation.
- **Vendor → Customer guard:** If you are a vendor and the other participant is a customer, and the customer has **never** sent a message in this conversation, you will receive `403 Forbidden` with the message:
  > "You cannot send a message until the customer has sent the first message"

**Real-time delivery:**
- Recipients receive the message instantly via Socket.IO on the event:
  ```
  neoshop.chat.message
  ```
- Frontend should listen to this event to update the chat UI without polling.

---

### 6. Delete a message

```http
DELETE /api/v1/chat/conversations/:conversationId/messages/:messageId
```

**Rules:**
- You can only delete **your own** messages.
- You must be a participant in the conversation.
- Deletion is **soft delete** — the message disappears from list queries but remains in the database.

**Response:**
```json
{
  "success": true
}
```

---

## Frontend Implementation Guide by Role

### Customer Frontend

**Starting a chat with a vendor:**
```http
POST /api/v1/chat/conversations
{ "withUserId": "<vendor-user-id>" }
```

**Starting a chat with admin (support):**
```http
POST /api/v1/chat/conversations
{ "withUserId": "<admin-user-id>" }
```

**Sending messages:** Use `POST /api/v1/chat/conversations/:id/messages` freely. No restrictions.

---

### Vendor Frontend

**Starting a chat with an admin:**
```http
POST /api/v1/chat/conversations
{ "withUserId": "<admin-user-id>" }
```

**Replying to a customer:**
- The vendor **cannot** create the conversation. The customer must create it first.
- Once the conversation exists, the vendor can call `POST /api/v1/chat/conversations/:id/messages`.
- However, if the vendor tries to send the **very first message** before the customer has said anything, the API returns `403 Forbidden`.
- Therefore, the vendor UI should either:
  - Only show the reply input after the customer has sent at least one message, or
  - Handle the `403` error gracefully with a message like "Wait for the customer to send the first message."

**Important:** A vendor should never see a "Start chat with customer" button. They should only see conversations that customers have already started.

---

### Admin Frontend

**Starting a chat with anyone:**
```http
POST /api/v1/chat/conversations
{ "withUserId": "<vendor-or-customer-user-id>" }
```

Admins have no restrictions on who they can message.

---

## Socket.IO Real-Time Setup

Connect to the backend Socket.IO namespace and listen for:

```javascript
socket.on('neoshop.chat.message', (message) => {
  // message shape:
  // {
  //   id: "...",
  //   conversationId: "...",
  //   senderUserId: "...",
  //   body: "...",
  //   createdAt: "..."
  // }
});
```

The backend emits the event to the `user:{userId}` room, so each user receives messages for all conversations they participate in.

---

## Error Reference

| Status | Meaning |
|--------|---------|
| `400 Bad Request` | Cannot chat with yourself / message doesn't belong to this conversation |
| `403 Forbidden` | Not a participant / initiation not allowed by role / vendor sending first message to customer / trying to delete someone else's message |
| `404 Not Found` | Peer user not found or suspended / message not found |

---

## Summary

- **Customers** can start chats with vendors and admins freely.
- **Admins** can start chats with vendors and customers freely.
- **Vendors** can only start chats with admins. They can reply to customers **only after** the customer has sent the first message.
- Messages are **create, read, delete only** — no editing.
- All participants receive new messages in real-time via Socket.IO.
