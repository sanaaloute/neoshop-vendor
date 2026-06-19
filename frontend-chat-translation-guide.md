# NeoShop — AI Chat Translation (Frontend Integration Guide)

> **Base URL:** `https://api.barkosem.com/api/v1`  
> **Auth:** Supabase JWT Bearer token (`Authorization: Bearer <access_token>`)  
> **Version:** `v1`  
> **Last updated:** 2026-06-19

---

## Global Conventions

### Required Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | All chat endpoints | `Bearer <supabase-access-token>` (JWT, HS256) |
| `X-Request-Id` | Optional | Unique request ID (echoed in response, used for tracing) |
| `X-Correlation-Id` | Optional | Correlation ID for distributed tracing |
| `Content-Type` | POST/PATCH | `application/json` |
| `User-Agent` | Auto-captured | Used for session tracking |

### Guard Chain

`JwtAuthGuard` → `RolesGuard` → `PermissionsGuard` → `SessionActiveGuard` → `ThrottlerGuard`

- Chat endpoints require `CHAT_PARTICIPATE` permission
- Role-based initiation rules apply (see below)

### Response Format

All JSON responses follow this envelope:

```json
{
  "statusCode": 200,
  "message": "OK",
  "error": "Error",
  "path": "/api/v1/...",
  "requestId": "req-uuid",
  "correlationId": "corr-uuid",
  "timestamp": "2024-06-12T10:00:00.000Z"
}
```

---

## Overview

NeoShop translates chat messages automatically when the sender and receiver have different language preferences. The translation is powered by an Ollama LLM running inside the Docker Compose stack.

### How it works

1. Each user sets a **preferred language** in their settings (e.g. `en`, `fr`, `es`, `ar`).
2. When User A sends a message to User B, the backend checks both languages.
3. If they differ, the message is translated and stored alongside the original.
4. The **receiver** gets both the original text and the translated text via Socket.IO.
5. The **sender** only sees their original text.

### Supported languages

Any ISO 639-1 language code is accepted (e.g. `en`, `fr`, `es`, `de`, `it`, `pt`, `ar`, `zh`, `ja`, `sw`, `yo`, `ha`). There is no hardcoded allowlist — the LLM handles the translation.

### Translation Service Resilience

The translation service uses a multi-layer fallback strategy:

1. **Ollama Cloud** — Tried first if `OLLAMA_CLOUD_API_KEY` is configured
2. **Local Ollama** — Falls back to self-hosted Ollama instance
3. **Original text** — If both fail, message is delivered untranslated (chat never breaks)

**System prompt domain context:** The LLM is instructed to preserve numbers, currency amounts, units (kg, cbm, liters, pieces), dates, and technical specifications exactly. Uses precise B2B terminology.

**Model configuration:** `temperature: 0.1`, `num_predict` dynamically sized to `max(128, inputLength * 3)`.

**Cleaning logic:** Aggressively strips markdown code blocks, backticks, quotes, prefixes like "Translation:", "In French:", etc., and suffixes like notes/explanations.

**If input is already in target language:** Ollama is instructed to output unchanged.

---

## Role & Permission Model

### Chat Access Rules

| Role | Can Initiate With | Permission |
|------|-------------------|------------|
| `super_admin` | Any user | `CHAT_PARTICIPATE` |
| `admin` | Any user | `CHAT_PARTICIPATE` |
| `customer` | `vendor`, `admin` | `CHAT_PARTICIPATE` |
| `vendor` | `admin` only | `CHAT_PARTICIPATE` |
| Same-role (non-admin) | ❌ Not allowed | — |

### Vendor Message Restriction

**A vendor may NOT send any message to a customer until the customer has sent at least one message in that conversation** (including deleted messages). This applies to all messages, not just the first one.

### Self-Conversation Blocked

Opening a conversation with yourself throws `400 Bad Request`.

### Suspended Users

Peers with `suspendedAt` set are treated as `NotFoundException` (404).

---

## User Settings — Language Preference

### `GET /users/me/settings`

Retrieve the current user's notification and language settings.

**Permission:** `SETTINGS_MANAGE`

**Headers:**
```
Authorization: Bearer <supabase_access_token>
```

**Response:**
```json
{
  "orderUpdates": true,
  "promoMessages": true,
  "emailNewsletter": true,
  "pushEnabled": true,
  "preferredLanguage": "en"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `orderUpdates` | `boolean` | Email/push for order status changes |
| `promoMessages` | `boolean` | Marketing promotions |
| `emailNewsletter` | `boolean` | Newsletter subscription |
| `pushEnabled` | `boolean` | Push notifications toggle |
| `preferredLanguage` | `string \| null` | ISO 639-1 language code. Defaults to `"en"` if never set. |

---

### `PATCH /users/me/settings`

Update the current user's settings, including language preference.

**Permission:** `SETTINGS_MANAGE`

**Headers:**
```
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

**Request body:**
```json
{
  "preferredLanguage": "fr"
}
```

**Partial update** — send only the fields you want to change. All fields are optional.

**Request body (full example):**
```json
{
  "orderUpdates": true,
  "promoMessages": false,
  "emailNewsletter": true,
  "pushEnabled": true,
  "preferredLanguage": "fr"
}
```

**Validation rules:**
- `preferredLanguage`: string, max 10 characters, ISO 639-1 format

**Response:**
```json
{
  "orderUpdates": true,
  "promoMessages": false,
  "emailNewsletter": true,
  "pushEnabled": true,
  "preferredLanguage": "fr"
}
```

**Error responses:**
- `401 Unauthorized` — missing or invalid JWT
- `400 Bad Request` — invalid body (e.g. `preferredLanguage` exceeds 10 chars)

---

## Chat REST API

### Translation fields

All chat endpoints now include translation fields when a message has been translated.

| Field | Type | Presence | Description |
|-------|------|----------|-------------|
| `translatedBody` | `string` | Optional | The translated message text |
| `originalLanguage` | `string` | Optional | Sender's language code (e.g. `en`) |
| `targetLanguage` | `string` | Optional | Receiver's language code (e.g. `fr`) |

These fields are **omitted** when sender and receiver share the same language.

---

### `POST /chat/conversations`

Open or resume a 1:1 conversation with another user.

**Permission:** `CHAT_PARTICIPATE`

**Request Body:**
```json
{
  "withUserId": "user-uuid",               // optional, UUID v4 — exactly one of withUserId/withVendorId required
  "withVendorId": "vendor-uuid"             // optional, UUID v4 — exactly one of withUserId/withVendorId required
}
```

**Validation rules:**
- Exactly one of `withUserId` or `withVendorId` must be provided
- Both fields are UUID v4 format
- Self-conversation is blocked (400)
- Role-based initiation rules enforced (see Role & Permission Model above)

**Response:**
```json
{
  "id": "conv-uuid",
  "createdAt": "2024-06-12T10:00:00Z",
  "updatedAt": "2024-06-12T10:00:00Z",
  "participants": [
    {
      "userId": "user-a",
      "joinedAt": "2024-06-12T10:00:00Z",
      "user": {
        "id": "user-a",
        "email": "alice@example.com",
        "name": "Alice",
        "surname": "Doe",
        "phone": "+22501234567",
        "avatarUrl": "https://...",
        "role": "customer"
      }
    },
    {
      "userId": "user-b",
      "joinedAt": "2024-06-12T10:00:00Z",
      "user": {
        "id": "user-b",
        "email": "bob@example.com",
        "name": "Bob",
        "surname": "Smith",
        "phone": "+22507654321",
        "avatarUrl": "https://...",
        "role": "vendor"
      }
    }
  ]
}
```

**Error responses:**
- `400 Bad Request` — Both/neither withUserId and withVendorId provided, or self-conversation
- `401 Unauthorized` — missing or invalid JWT
- `403 Forbidden` — role-based initiation blocked (e.g. vendor trying to initiate with customer)
- `404 Not Found` — Peer user not found or suspended

> **Note:** If a conversation already exists with the same peer, the existing conversation is returned (idempotent).

---

### `GET /chat/conversations`

List all conversations the current user participates in.

**Permission:** `CHAT_PARTICIPATE`

**Headers:**
```
Authorization: Bearer <supabase_access_token>
```

**Response:**
```json
{
  "items": [
    {
      "id": "conv-uuid",
      "createdAt": "2024-06-12T10:00:00Z",
      "updatedAt": "2024-06-12T14:30:00Z",
      "participants": [
        {
          "userId": "user-a",
          "joinedAt": "2024-06-12T10:00:00Z",
          "user": {
            "id": "user-a",
            "email": "alice@example.com",
            "name": "Alice",
            "surname": "Doe",
            "phone": "+22501234567",
            "avatarUrl": "https://...",
            "role": "customer"
          }
        }
      ],
      "messages": [
        {
          "id": "msg-uuid",
          "messageType": "text",
          "body": "Hello, what is the MOQ for this item?",
          "translatedBody": "Bonjour, quelle est la quantité minimum pour cet article ?",
          "originalLanguage": "en",
          "targetLanguage": "fr",
          "senderUserId": "user-a",
          "attachments": [],
          "createdAt": "2024-06-12T14:30:00Z"
        }
      ]
    },
    {
      "id": "conv-uuid-2",
      "createdAt": "2024-06-12T10:00:00Z",
      "updatedAt": "2024-06-12T15:00:00Z",
      "participants": [
        {
          "userId": "user-b",
          "joinedAt": "2024-06-12T10:00:00Z",
          "user": {
            "id": "user-b",
            "email": "bob@example.com",
            "name": "Bob",
            "surname": "Smith",
            "phone": "+22507654321",
            "avatarUrl": "https://...",
            "role": "vendor"
          }
        }
      ],
      "messages": [
        {
          "id": "msg-uuid-2",
          "messageType": "image",
          "body": null,
          "senderUserId": "user-b",
          "attachments": [
            {
              "id": "att-uuid",
              "fileUrl": "conv-uuid-2/att-uuid/attachment_1234567890.jpg",
              "mimeType": "image/jpeg",
              "fileSize": 245678,
              "fileName": "product.jpg"
            }
          ],
          "createdAt": "2024-06-12T15:00:00Z"
        }
      ]
    }
  ]
}
```

**Ordering:** Conversations ordered by `updatedAt: desc` (most recently active first).

**Frontend note:** `messages` contains only the latest message (`take: 1`). Use it for the conversation preview.
- If `translatedBody` is present and the message is from the **other** participant, show the translated text in the preview.
- If the latest message has `messageType: "image"` or `"mixed"`, the preview should show an image indicator (e.g. "📷 Image"). The attachments in conversation-list responses do **not** include `signedUrl`; call `POST /storage/read-urls` to resolve `fileUrl` paths to temporary signed URLs.

---

### `GET /chat/conversations/:conversationId`

Get conversation metadata and participants.

**Permission:** `CHAT_PARTICIPATE` — must be a participant

**Response:**
```json
{
  "id": "conv-uuid",
  "createdAt": "2024-06-12T10:00:00Z",
  "updatedAt": "2024-06-12T14:30:00Z",
  "participants": [
    {
      "userId": "user-a",
      "joinedAt": "2024-06-12T10:00:00Z",
      "user": {
        "id": "user-a",
        "email": "alice@example.com",
        "name": "Alice",
        "surname": "Doe",
        "phone": "+22501234567",
        "avatarUrl": "https://...",
        "role": "customer"
      }
    },
    {
      "userId": "user-b",
      "joinedAt": "2024-06-12T10:00:00Z",
      "user": {
        "id": "user-b",
        "email": "bob@example.com",
        "name": "Bob",
        "surname": "Smith",
        "phone": "+22507654321",
        "avatarUrl": "https://...",
        "role": "vendor"
      }
    }
  ]
}
```

**Error responses:**
- `403 Forbidden` — Not a participant in this conversation
- `404 Not Found` — Conversation does not exist

---

### `GET /chat/conversations/:conversationId/messages`

Paginated message history for a single conversation.

**Permission:** `CHAT_PARTICIPATE` — must be a participant

**Headers:**
```
Authorization: Bearer <supabase_access_token>
```

**Query parameters:**
| Param | Type | Default | Constraints |
|-------|------|---------|-------------|
| `skip` | `integer` | `0` | Min 0 |
| `take` | `integer` | `50` | 1-100 |

**Response:**
```json
{
  "items": [
    {
      "id": "msg-uuid",
      "senderUserId": "user-a",
      "messageType": "text",
      "body": "Hello, what is the MOQ for this item?",
      "translatedBody": "Bonjour, quelle est la quantité minimum pour cet article ?",
      "originalLanguage": "en",
      "targetLanguage": "fr",
      "attachments": [],
      "createdAt": "2024-06-12T14:30:00Z"
    },
    {
      "id": "msg-uuid-2",
      "senderUserId": "user-b",
      "messageType": "image",
      "body": null,
      "attachments": [
        {
          "id": "att-uuid",
          "fileUrl": "conv-uuid/att-uuid/attachment_1234567890.jpg",
          "mimeType": "image/jpeg",
          "fileSize": 245678,
          "fileName": "product.jpg"
        }
      ],
      "createdAt": "2024-06-12T14:25:00Z"
    }
  ],
  "total": 42,
  "skip": 0,
  "take": 50
}
```

**Ordering:** Messages ordered by `createdAt: desc` (newest first).

**Important:**
- `translatedBody` is only present when the sender and the **requesting user** had different languages at the time the message was sent. Messages sent by the requesting user never include `translatedBody`.
- Attachments in message-history responses include metadata (`fileUrl`, `mimeType`, `fileSize`, `fileName`) but not `signedUrl`. To display images, call `POST /storage/read-urls` with the attachment `fileUrl`(s) to obtain temporary signed URLs.

---

### `POST /chat/conversations/:conversationId/messages`

Send a new message.

**Permission:** `CHAT_PARTICIPATE` — must be a participant

**Headers:**
```
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

**Request body:**
```json
{
  "body": "Hello, what is the MOQ for this item?"
}
```

**Validation:**
- `body`: optional string, max 4000 characters (required if `attachments` is omitted)
- `attachments`: optional array, max 10 items

**Attachment object:**
| Field | Type | Description |
|-------|------|-------------|
| `fileName` | `string` | Original file name |
| `mimeType` | `string` | `image/jpeg`, `image/png`, `image/webp`, or `application/pdf` |
| `fileSize` | `integer` | Size in bytes |
| `fileUrl` | `string` | Object path returned from `POST /chat/conversations/:id/attachments` |

**Response (text-only):**
```json
{
  "id": "msg-uuid",
  "conversationId": "conv-uuid",
  "senderUserId": "user-a",
  "messageType": "text",
  "body": "Hello, what is the MOQ for this item?",
  "attachments": [],
  "createdAt": "2024-06-12T14:30:00Z"
}
```

**Response (image message):**
```json
{
  "id": "msg-uuid",
  "conversationId": "conv-uuid",
  "senderUserId": "user-a",
  "messageType": "image",
  "body": null,
  "attachments": [
    {
      "id": "att-uuid",
      "fileUrl": "conv-uuid/att-uuid/attachment_1234567890.jpg",
      "mimeType": "image/jpeg",
      "fileSize": 245678,
      "fileName": "product.jpg",
      "signedUrl": "https://...signed-url...",
      "expiresIn": 300
    }
  ],
  "createdAt": "2024-06-12T14:30:00Z"
}
```

The response **does not** include `translatedBody` because translation happens asynchronously after the message is created. The receiver will receive the translated version via the Socket.IO event `neoshop.chat.message`.

**Error responses:**
- `401 Unauthorized` — invalid JWT
- `403 Forbidden` — not a participant in this conversation
- `403 Forbidden` — vendor trying to send message to customer before customer has sent any message
- `400 Bad Request` — body exceeds 4000 chars, or both body and attachments are missing, or more than 10 attachments
- `404 Not Found` — conversation does not exist

---

### `POST /chat/conversations/:conversationId/attachments`

Upload a single image or PDF attachment to a conversation. The returned `fileUrl` (and temporary `signedUrl`) is later attached to a message via `POST /chat/conversations/:id/messages`.

**Permission:** `CHAT_PARTICIPATE` — must be a participant

**Headers:**
```
Authorization: Bearer <supabase_access_token>
Content-Type: multipart/form-data
```

**Form fields:**
| Field | Type | Description |
|-------|------|-------------|
| `file` | `binary` | Required. Image (jpg, png, webp; max 5 MB) or PDF (max 10 MB) |

**Response:**
```json
{
  "id": "att-uuid",
  "messageId": null,
  "fileUrl": "conv-uuid/att-uuid/attachment_1234567890.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 245678,
  "fileName": "product.jpg",
  "signedUrl": "https://...signed-url...",
  "expiresIn": 300,
  "createdAt": "2024-06-12T14:30:00Z"
}
```

**Error responses:**
- `400 Bad Request` — missing file, unsupported MIME type, or file exceeds size limit (images 5 MB, PDFs 10 MB)
- `403 Forbidden` — not a participant in this conversation
- `401 Unauthorized` — invalid JWT

---

### `DELETE /chat/conversations/:conversationId/messages/:messageId`

Delete your own message (hard delete).

**Permission:** `CHAT_PARTICIPATE` — must be the message sender

**Response:**
```json
{
  "success": true
}
```

**Error responses:**
- `403 Forbidden` — Not the message sender
- `404 Not Found` — Message not found in this conversation

> **Note:** Messages are hard-deleted (not soft-deleted). Deleted messages still count for vendor-first-message restriction logic.

---

## Real-Time Events (Socket.IO)

### Connection

```typescript
const socket = io('https://api.barkosem.com/realtime', {
  transports: ['websocket', 'polling'],
  auth: {
    token: supabaseAccessToken,
  },
});
```

**Connection lifecycle:**
1. Client connects with JWT token in `auth.token`
2. Server verifies token and checks user suspension status
3. Server joins user to rooms:
   - `user:{userId}` — all users
   - `admin:dashboard` — admins only
   - `vendor:{vendorId}` — vendors only
4. Server disconnects client if user is suspended

### `neoshop.chat.message`

Fired when a new message is sent to a conversation you participate in.

**Payload when you are the sender** (languages don't matter — you always receive this shape):
```json
{
  "id": "msg-uuid",
  "conversationId": "conv-uuid",
  "senderUserId": "user-a",
  "messageType": "text",
  "body": "Hello, what is the MOQ for this item?",
  "attachments": [],
  "createdAt": "2024-06-12T14:30:00Z"
}
```

**Payload when you are the receiver** and languages differ:
```json
{
  "id": "msg-uuid",
  "conversationId": "conv-uuid",
  "senderUserId": "user-a",
  "messageType": "text",
  "body": "Hello, what is the MOQ for this item?",
  "translatedBody": "Bonjour, quelle est la quantité minimum pour cet article ?",
  "originalLanguage": "en",
  "targetLanguage": "fr",
  "attachments": [],
  "createdAt": "2024-06-12T14:30:00Z"
}
```

**Payload when you are the receiver** and languages are the same:
```json
{
  "id": "msg-uuid",
  "conversationId": "conv-uuid",
  "senderUserId": "user-a",
  "messageType": "text",
  "body": "Hello, what is the MOQ for this item?",
  "attachments": [],
  "createdAt": "2024-06-12T14:30:00Z"
}
```

**Key rule:** Check `translatedBody` to decide whether to show a translation UI. Never infer translation from `senderUserId` alone.

---

## Frontend Implementation Guide

### Step 1 — Type definitions

```typescript
// types/chat.ts

export type ChatMessageType = 'text' | 'image' | 'mixed' | 'document';

export interface ChatMessageAttachment {
  id: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  fileName: string;
  // signedUrl is present only on send responses and Socket.IO events.
  // Conversation list and message history return fileUrl only; resolve it
  // via POST /storage/read-urls before rendering.
  signedUrl?: string;
  expiresIn?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  messageType: ChatMessageType;
  body: string | null;
  attachments: ChatMessageAttachment[];
  createdAt: string;
  // Translation fields (only present when applicable)
  translatedBody?: string;
  originalLanguage?: string;
  targetLanguage?: string;
}

export interface ChatConversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipant[];
  messages?: ChatMessage[]; // latest message only (take: 1)
}

export interface ChatParticipant {
  userId: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    surname: string | null;
    phone: string | null;
    avatarUrl: string | null;
    role: string;
  };
}

export interface UserSettings {
  orderUpdates: boolean;
  promoMessages: boolean;
  emailNewsletter: boolean;
  pushEnabled: boolean;
  preferredLanguage: string | null;
}
```

---

### Step 2 — Settings page (language selector)

```typescript
// api/settings.ts
import axios from 'axios';

const API_BASE = 'https://api.barkosem.com/api/v1';

export async function getSettings(token: string): Promise<UserSettings> {
  const res = await axios.get(`${API_BASE}/users/me/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updateSettings(
  token: string,
  partial: Partial<UserSettings>
): Promise<UserSettings> {
  const res = await axios.patch(`${API_BASE}/users/me/settings`, partial, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return res.data;
}
```

```tsx
// components/LanguageSelector.tsx
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ar', label: 'العربية' },
  { code: 'pt', label: 'Português' },
  { code: 'zh', label: '中文' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'yo', label: 'Yorùbá' },
  { code: 'ha', label: 'Hausa' },
];

export function LanguageSelector({ token }: { token: string }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    getSettings(token).then(setSettings);
  }, [token]);

  const handleChange = async (code: string) => {
    const updated = await updateSettings(token, { preferredLanguage: code });
    setSettings(updated);
  };

  return (
    <select
      value={settings?.preferredLanguage ?? 'en'}
      onChange={(e) => handleChange(e.target.value)}
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
```

---

### Step 3 — Chat API helpers

```typescript
// api/chat.ts
import axios from 'axios';
import type { ChatConversation, ChatMessage } from '../types/chat';

const API_BASE = 'https://api.barkosem.com/api/v1';

export async function createConversation(
  token: string,
  params: { withUserId?: string; withVendorId?: string }
): Promise<ChatConversation> {
  const res = await axios.post(`${API_BASE}/chat/conversations`, params, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return res.data;
}

export async function getConversations(token: string): Promise<{ items: ChatConversation[] }> {
  const res = await axios.get(`${API_BASE}/chat/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getConversation(
  token: string,
  conversationId: string
): Promise<ChatConversation> {
  const res = await axios.get(`${API_BASE}/chat/conversations/${conversationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getMessages(
  token: string,
  conversationId: string,
  skip = 0,
  take = 50
): Promise<{ items: ChatMessage[]; total: number; skip: number; take: number }> {
  const res = await axios.get(
    `${API_BASE}/chat/conversations/${conversationId}/messages`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params: { skip, take },
    }
  );
  return res.data;
}

export interface SendMessageInput {
  body?: string;
  attachments?: Array<{
    fileName: string;
    mimeType: string;
    fileSize: number;
    fileUrl: string;
  }>;
}

export async function sendMessage(
  token: string,
  conversationId: string,
  input: SendMessageInput
): Promise<ChatMessage> {
  const res = await axios.post(
    `${API_BASE}/chat/conversations/${conversationId}/messages`,
    input,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data;
}

export async function uploadChatAttachment(
  token: string,
  conversationId: string,
  file: File
): Promise<ChatMessageAttachment & { id: string; messageId: string | null; createdAt: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post(
    `${API_BASE}/chat/conversations/${conversationId}/attachments`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
}

export async function resolveAttachmentUrls(
  token: string,
  attachments: ChatMessageAttachment[]
): Promise<Array<{ fileUrl: string; signedUrl: string; expiresIn: number }>> {
  if (attachments.length === 0) return [];

  const res = await axios.post(
    `${API_BASE}/storage/read-urls`,
    {
      items: attachments.map((att) => ({
        bucket: 'chat-media',
        path: att.fileUrl,
      })),
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data.results;
}

export async function deleteMessage(
  token: string,
  conversationId: string,
  messageId: string
): Promise<{ success: boolean }> {
  const res = await axios.delete(
    `${API_BASE}/chat/conversations/${conversationId}/messages/${messageId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
}
```

---

### Step 4 — Socket.IO handler

```typescript
// hooks/useChatSocket.ts
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ChatMessage } from '../types/chat';

export function useChatSocket(
  token: string,
  currentUserId: string,
  onMessage: (msg: ChatMessage) => void
) {
  useEffect(() => {
    const socket: Socket = io('https://api.barkosem.com/realtime', {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('neoshop.chat.message', (msg: ChatMessage) => {
      // Add the message to your state/store
      onMessage(msg);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [token, currentUserId, onMessage]);
}
```

---

### Step 5 — Message bubble component

```tsx
// components/ChatMessageBubble.tsx
import { useState } from 'react';
import type { ChatMessage } from '../types/chat';

interface Props {
  msg: ChatMessage;
  currentUserId: string;
}

export function ChatMessageBubble({ msg, currentUserId }: Props) {
  const isMine = msg.senderUserId === currentUserId;
  const hasTranslation = !!msg.translatedBody;
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <div
      className={`message-bubble ${isMine ? 'sent' : 'received'}`}
      style={{
        alignSelf: isMine ? 'flex-end' : 'flex-start',
        backgroundColor: isMine ? '#DCF8C6' : '#FFFFFF',
      }}
    >
      {/* Show original for sender; show translated (or original) for receiver */}
      {msg.messageType !== 'text' && msg.attachments.length > 0 && (
        <div className="message-attachments">
          {msg.attachments.map((att) => (
            <img
              key={att.id}
              // For send/realtime messages signedUrl is present.
              // For history, resolve fileUrl via POST /storage/read-urls first.
              src={att.signedUrl ?? att.fileUrl}
              alt={att.fileName}
              style={{ maxWidth: '200px', borderRadius: '8px' }}
            />
          ))}
        </div>
      )}

      {msg.body && (
        <p className="message-text">
          {isMine || !hasTranslation || showOriginal
            ? msg.body
            : msg.translatedBody}
        </p>
      )}

      {/* Translation toggle (receiver only, when translation exists) */}
      {!isMine && hasTranslation && (
        <div className="translation-meta">
          <button
            className="translation-toggle"
            onClick={() => setShowOriginal((v) => !v)}
          >
            {showOriginal ? 'Show translation' : 'Show original'}
          </button>
          <span className="language-badge">
            {msg.originalLanguage} → {msg.targetLanguage}
          </span>
        </div>
      )}

      <span className="timestamp">
        {new Date(msg.createdAt).toLocaleTimeString()}
      </span>
    </div>
  );
}
```

---

### Step 6 — Conversation list preview

```typescript
// utils/chatPreview.ts
import type { ChatMessage } from '../types/chat';

export function getPreviewText(
  lastMessage: ChatMessage | undefined,
  currentUserId: string
): string {
  if (!lastMessage) return '';

  // If the last message is an image, show an image indicator
  if (lastMessage.messageType === 'image') {
    return '📷 Image';
  }
  if (lastMessage.messageType === 'mixed') {
    return '📷 Image + text';
  }

  // If you're the receiver and a translation exists, preview the translation
  const isFromOther = lastMessage.senderUserId !== currentUserId;
  if (isFromOther && lastMessage.translatedBody) {
    return lastMessage.translatedBody;
  }

  return lastMessage.body ?? '';
}
```

> To show an actual thumbnail for an image preview, call `resolveAttachmentUrls()` (see Step 3 helpers) with the latest message's attachments.

---

## Edge Cases & Behavior

| Scenario | Behavior |
|----------|----------|
| Same language | No translation. `translatedBody` is absent. |
| Ollama is down | Message is still delivered. `translatedBody` is absent. Chat never breaks. |
| Receiver has no `preferredLanguage` set | Defaults to `"en"`. If sender is `"en"`, no translation. If sender is `"fr"`, translation happens. |
| Message sent before language change | Historical messages keep their original `translatedBody` (if any). No retroactive re-translation. |
| Very long message | Max 4000 chars. Translation is truncated to the same limit. |
| Image / attachment messages | Up to 10 attachments per message (images jpg/png/webp max 5 MB; PDFs max 10 MB). `messageType` is `image`, `mixed`, or `document`. |
| Sending attachments | Upload via `POST /chat/conversations/:id/attachments`, then include `fileUrl` in `POST /chat/conversations/:id/messages`. |
| Special characters / numbers | The LLM is instructed to preserve numbers, currencies, units, and dates exactly. |
| Self-conversation | Blocked with `400 Bad Request`. |
| Vendor initiating with customer | Blocked with `403 Forbidden`. Customer must send first. |
| Same-role conversation (non-admin) | Blocked with `403 Forbidden`. |
| Suspended peer | Treated as `404 Not Found`. |
| Message deletion | Hard delete. Deleted messages still count for vendor-first-message restriction. |

---

## Quick Reference

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users/me/settings` | JWT | Get language preference |
| `PATCH` | `/users/me/settings` | JWT | Update language preference |
| `POST` | `/chat/conversations` | JWT + `CHAT_PARTICIPATE` | Open/resume conversation |
| `GET` | `/chat/conversations` | JWT + `CHAT_PARTICIPATE` | List conversations (latest message may have `translatedBody`) |
| `GET` | `/chat/conversations/:id` | JWT + `CHAT_PARTICIPATE` | Get conversation metadata |
| `GET` | `/chat/conversations/:id/messages` | JWT + `CHAT_PARTICIPATE` | Message history (may have `translatedBody`, newest first) |
| `POST` | `/chat/conversations/:id/messages` | JWT + `CHAT_PARTICIPATE` | Send text/image message |
| `POST` | `/chat/conversations/:id/attachments` | JWT + `CHAT_PARTICIPATE` | Upload image attachment |
| `DELETE` | `/chat/conversations/:id/messages/:msgId` | JWT + `CHAT_PARTICIPATE` | Delete own message |

### Socket.IO Event

| Event | Payload | When |
|-------|---------|------|
| `neoshop.chat.message` | `ChatMessage` (± `translatedBody`) | New message in any conversation you participate in |

### Required Frontend Changes

1. [ ] Add `preferredLanguage` selector to Settings / Profile page
2. [ ] Update `ChatMessage` type to include `messageType`, `attachments`, and optional `translatedBody`, `originalLanguage`, `targetLanguage`
3. [ ] Update `ChatConversation` type to include `updatedAt` and `participants`
3.5. [ ] Add `ChatMessageAttachment` type and `uploadChatAttachment` helper
4. [ ] Add `POST /chat/conversations` flow to start conversations before sending messages
5. [ ] Add `GET /chat/conversations/:id` to fetch conversation metadata
6. [ ] Add `DELETE /chat/conversations/:id/messages/:msgId` for message deletion UI
7. [ ] Update message bubble to conditionally render translation toggle
8. [ ] Update conversation list preview to prefer `translatedBody` when available
9. [ ] Update Socket.IO handler to accept the expanded payload
10. [ ] Handle role-based initiation rules in UI (disable "Message" button for vendor→customer)
