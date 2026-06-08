# NeoShop — AI Chat Translation (Frontend Integration Guide)

> **Base URL:** `https://api.barkosem.com/api/v1`  
> **Auth:** Supabase JWT Bearer token (`Authorization: Bearer <access_token>`)  
> **Version:** `v1`  
> **Last updated:** 2026-06-08

---

## Overview

Barkosem now translates chat messages automatically when the sender and receiver have different language preferences. The translation is powered by an Ollama LLM running inside the Docker Compose stack.

### How it works

1. Each user sets a **preferred language** in their settings (e.g. `en`, `fr`, `es`, `ar`).
2. When User A sends a message to User B, the backend checks both languages.
3. If they differ, the message is translated and stored alongside the original.
4. The **receiver** gets both the original text and the translated text via Socket.IO.
5. The **sender** only sees their original text.

### Supported languages

Any ISO 639-1 language code is accepted (e.g. `en`, `fr`, `es`, `de`, `it`, `pt`, `ar`, `zh`, `ja`, `sw`, `yo`, `ha`). There is no hardcoded allowlist — the LLM handles the translation.

---

## User Settings — Language Preference

### `GET /users/settings`

Retrieve the current user's notification and language settings.

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

### `PATCH /users/settings`

Update the current user's settings, including language preference.

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
- `preferredLanguage`: string, max 10 characters

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

## Chat REST API — Updated Response Fields

All chat endpoints now include translation fields when a message has been translated.

### Translation fields

| Field | Type | Presence | Description |
|-------|------|----------|-------------|
| `translatedBody` | `string` | Optional | The translated message text |
| `originalLanguage` | `string` | Optional | Sender's language code (e.g. `en`) |
| `targetLanguage` | `string` | Optional | Receiver's language code (e.g. `fr`) |

These fields are **omitted** when sender and receiver share the same language.

---

### `GET /chat/conversations`

List all conversations the current user participates in.

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
      "createdAt": "2026-06-08T10:00:00.000Z",
      "updatedAt": "2026-06-08T14:30:00.000Z",
      "participants": [
        {
          "userId": "user-a",
          "joinedAt": "2026-06-08T10:00:00.000Z",
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
          "body": "Hello, what is the MOQ for this item?",
          "translatedBody": "Bonjour, quelle est la quantité minimum pour cet article ?",
          "originalLanguage": "en",
          "targetLanguage": "fr",
          "senderUserId": "user-a",
          "createdAt": "2026-06-08T14:30:00.000Z"
        }
      ]
    }
  ]
}
```

**Frontend note:** `messages` contains only the latest message (`take: 1`). Use it for the conversation preview. If `translatedBody` is present and the message is from the **other** participant, show the translated text in the preview.

---

### `GET /chat/conversations/:conversationId/messages`

Paginated message history for a single conversation.

**Headers:**
```
Authorization: Bearer <supabase_access_token>
```

**Query parameters:**
| Param | Type | Default | Max |
|-------|------|---------|-----|
| `skip` | `integer` | `0` | — |
| `take` | `integer` | `50` | `100` |

**Response:**
```json
{
  "items": [
    {
      "id": "msg-uuid",
      "senderUserId": "user-a",
      "body": "Hello, what is the MOQ for this item?",
      "translatedBody": "Bonjour, quelle est la quantité minimum pour cet article ?",
      "originalLanguage": "en",
      "targetLanguage": "fr",
      "createdAt": "2026-06-08T14:30:00.000Z"
    },
    {
      "id": "msg-uuid-2",
      "senderUserId": "user-b",
      "body": "The MOQ is 500 pieces at $2.50 per unit.",
      "createdAt": "2026-06-08T14:25:00.000Z"
    }
  ],
  "total": 42,
  "skip": 0,
  "take": 50
}
```

**Important:** `translatedBody` is only present when the sender and the **requesting user** had different languages at the time the message was sent. Messages sent by the requesting user never include `translatedBody`.

---

### `POST /chat/conversations/:conversationId/messages`

Send a new message.

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
- `body`: required string, max 4000 characters

**Response:**
```json
{
  "id": "msg-uuid",
  "conversationId": "conv-uuid",
  "senderUserId": "user-a",
  "body": "Hello, what is the MOQ for this item?",
  "createdAt": "2026-06-08T14:30:00.000Z"
}
```

The response **does not** include `translatedBody` because translation happens asynchronously after the message is created. The receiver will receive the translated version via the Socket.IO event `neoshop.chat.message`.

**Error responses:**
- `401 Unauthorized` — invalid JWT
- `403 Forbidden` — not a participant in this conversation
- `403 Forbidden` — vendor trying to send first message in a customer-initiated thread
- `400 Bad Request` — body exceeds 4000 chars or is empty
- `404 Not Found` — conversation does not exist

---

## Real-Time Events (Socket.IO)

### Connection

```typescript
const socket = io('https://api.barkosem.com/realtime', {
  transports: ['websocket', 'polling'],
  auth: {
    token: supabaseAccessToken, // or pass via Authorization header
  },
});
```

### `neoshop.chat.message`

Fired when a new message is sent to a conversation you participate in.

**Payload when you are the sender** (languages don't matter — you always receive this shape):
```json
{
  "id": "msg-uuid",
  "conversationId": "conv-uuid",
  "senderUserId": "user-a",
  "body": "Hello, what is the MOQ for this item?",
  "createdAt": "2026-06-08T14:30:00.000Z"
}
```

**Payload when you are the receiver** and languages differ:
```json
{
  "id": "msg-uuid",
  "conversationId": "conv-uuid",
  "senderUserId": "user-a",
  "body": "Hello, what is the MOQ for this item?",
  "translatedBody": "Bonjour, quelle est la quantité minimum pour cet article ?",
  "originalLanguage": "en",
  "targetLanguage": "fr",
  "createdAt": "2026-06-08T14:30:00.000Z"
}
```

**Payload when you are the receiver** and languages are the same:
```json
{
  "id": "msg-uuid",
  "conversationId": "conv-uuid",
  "senderUserId": "user-a",
  "body": "Hello, what is the MOQ for this item?",
  "createdAt": "2026-06-08T14:30:00.000Z"
}
```

**Key rule:** Check `translatedBody` to decide whether to show a translation UI. Never infer translation from `senderUserId` alone.

---

## Frontend Implementation Guide

### Step 1 — Type definitions

```typescript
// types/chat.ts

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  createdAt: string;
  // Translation fields (only present when applicable)
  translatedBody?: string;
  originalLanguage?: string;
  targetLanguage?: string;
}

export interface UserSettings {
  orderUpdates: boolean;
  promoMessages: boolean;
  emailNewsletter: boolean;
  pushEnabled: boolean;
  preferredLanguage: string | null;
}
```

### Step 2 — Settings page (language selector)

```typescript
// api/settings.ts
import axios from 'axios';

const API_BASE = 'https://api.barkosem.com/api/v1';

export async function getSettings(token: string): Promise<UserSettings> {
  const res = await axios.get(`${API_BASE}/users/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updateSettings(
  token: string,
  partial: Partial<UserSettings>
): Promise<UserSettings> {
  const res = await axios.patch(`${API_BASE}/users/settings`, partial, {
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

### Step 3 — Socket.IO handler

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

### Step 4 — Message bubble component

```tsx
// components/ChatMessageBubble.tsx
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
      <p className="message-text">
        {isMine || !hasTranslation || showOriginal
          ? msg.body
          : msg.translatedBody}
      </p>

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

### Step 5 — Conversation list preview

```typescript
// utils/chatPreview.ts
import type { ChatMessage } from '../types/chat';

export function getPreviewText(
  lastMessage: ChatMessage | undefined,
  currentUserId: string
): string {
  if (!lastMessage) return '';

  // If you're the receiver and a translation exists, preview the translation
  const isFromOther = lastMessage.senderUserId !== currentUserId;
  if (isFromOther && lastMessage.translatedBody) {
    return lastMessage.translatedBody;
  }

  return lastMessage.body;
}
```

---

## Edge Cases & Behavior

| Scenario | Behavior |
|----------|----------|
| Same language | No translation. `translatedBody` is absent. |
| Ollama is down | Message is still delivered. `translatedBody` is absent. Chat never breaks. |
| Receiver has no `preferredLanguage` set | Defaults to `"en"`. If sender is `"en"`, no translation. If sender is `"fr"`, translation happens. |
| Message sent before language change | Historical messages keep their original `translatedBody` (if any). No retroactive re-translation. |
| Very long message | Max 4000 chars. Translation is truncated to the same limit. |
| Special characters / numbers | The LLM is instructed to preserve numbers, currencies, units, and dates exactly. |

---

## Quick Reference

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users/settings` | JWT | Get language preference |
| `PATCH` | `/users/settings` | JWT | Update language preference |
| `GET` | `/chat/conversations` | JWT | List conversations (latest message may have `translatedBody`) |
| `GET` | `/chat/conversations/:id/messages` | JWT | Message history (may have `translatedBody`) |
| `POST` | `/chat/conversations/:id/messages` | JWT | Send message (response never has `translatedBody`) |

### Socket.IO Event

| Event | Payload | When |
|-------|---------|------|
| `neoshop.chat.message` | `ChatMessage` (± `translatedBody`) | New message in any conversation you participate in |

### Required Frontend Changes

1. [ ] Add `preferredLanguage` selector to Settings / Profile page
2. [ ] Update `ChatMessage` type to include optional `translatedBody`, `originalLanguage`, `targetLanguage`
3. [ ] Update message bubble to conditionally render translation toggle
4. [ ] Update conversation list preview to prefer `translatedBody` when available
5. [ ] Update Socket.IO handler to accept the expanded payload
