# NeoShop — Vendor Authentication & Session Management Guide

> **Scope:** Auth and session endpoints used by the vendor frontend.  
> **Base URL:** `https://api.barkosem.com/api/v1`  
> **Auth scheme:** Supabase JWT Bearer token (`Authorization: Bearer <access_token>`)  
> **Session tracking:** `X-Session-Id: <session_id>` on logout

These endpoints are shared by all frontend roles, but the examples below are written for a **vendor** account. To create a vendor account, set `role: "vendor"` during registration.

---

## Quick Reference

| Method | Path | Purpose | Rate Limit |
|--------|------|---------|------------|
| `POST` | `/auth/register` | Register a new vendor account | 5 / 60 s |
| `POST` | `/auth/login` | Login with email + password | 10 / 60 s |
| `POST` | `/auth/register/phone/initiate` | Send OTP for phone registration | 3 / 60 s |
| `POST` | `/auth/register/phone` | Register with phone + password | 5 / 60 s |
| `POST` | `/auth/register/phone/verify` | Complete phone registration with OTP | 5 / 60 s |
| `POST` | `/auth/login/phone/initiate` | Send OTP for phone login | 3 / 60 s |
| `POST` | `/auth/login/phone` | Login with phone + password | 10 / 60 s |
| `POST` | `/auth/login/phone/verify` | Complete phone login with OTP | 5 / 60 s |
| `POST` | `/auth/reactivate` | Reactivate an account pending deletion | 5 / 60 s |
| `POST` | `/auth/forgot-password` | Request password-reset email | 3 / 60 s |
| `POST` | `/auth/reset-password` | Reset password with recovery token | 5 / 60 s |
| `POST` | `/auth/resend-verification` | Resend email verification link | 3 / 60 s |
| `POST` | `/auth/change-email` | Initiate email change | 3 / 60 s |
| `GET`  | `/auth/me` | Get current authenticated user | — |
| `POST` | `/auth/sessions` | Register/refresh a server-tracked session | — |
| `POST` | `/auth/refresh` | Exchange refresh token for new access token | 20 / 60 s |
| `POST` | `/auth/logout` | Revoke current session | — |
| `POST` | `/auth/logout/all` | Revoke all user sessions | — |

---

## Common Request/Response Shapes

### Authenticated User Object

Returned by registration, login, `/auth/me`, and refresh:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "supabaseUserId": "d0b1c2d3-e4f5-6789-0123-456789abcdef",
  "email": "vendor@acme.com",
  "role": "vendor",
  "emailVerifiedAt": "2024-06-01T10:00:00.000Z"
}
```

- `role` is always `"vendor"` for a vendor account.
- `emailVerifiedAt` is `null` until the vendor confirms their email.

### Token Bundle

Returned by login, phone login/registration/verify, reactivate, and refresh:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "<opaque-or-jwt-refresh-token>",
  "expiresIn": 3600,
  "expiresAt": 1718186400,
  "sessionId": "550e8400-e29b-41d4-a716-446655440001"
}
```

- `expiresAt` is a **Unix timestamp in seconds**.
- `sessionId` is required for `/auth/refresh`, `/auth/sessions`, logout, and WebSocket auth.

---

## Registration

### `POST /auth/register`

Create a new vendor account. A verification email is sent; the vendor must confirm the email before logging in.

**Rate Limit:** 5 requests / 60 s / IP

**Request Body:**

```json
{
  "email": "vendor@acme.com",
  "password": "SecurePass123!",
  "name": "Amina",
  "surname": "Sanou",
  "phone": "+22670123456",
  "role": "vendor"
}
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `email` | yes | valid email, max 255 chars |
| `password` | yes | 8–128 chars, at least 1 uppercase, 1 lowercase, 1 digit |
| `name` | no | string, max 128 chars |
| `surname` | no | string, max 128 chars |
| `phone` | no | E.164 format, e.g. `+22670123456`, max 50 chars |
| `role` | no | `"customer"` or `"vendor"`; default `"customer"` |

**Response:**

```json
{
  "success": true,
  "message": "Account created. Please check your email to verify your account before logging in.",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "supabaseUserId": "d0b1c2d3-e4f5-6789-0123-456789abcdef",
    "email": "vendor@acme.com",
    "role": "vendor",
    "emailVerifiedAt": null
  }
}
```

**cURL Example:**

```bash
curl -X POST https://api.barkosem.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendor@acme.com",
    "password": "SecurePass123!",
    "name": "Amina",
    "surname": "Sanou",
    "phone": "+22670123456",
    "role": "vendor"
  }'
```

**Error Codes:**

| Status | Meaning |
|--------|---------|
| `400` | Validation error (weak password, invalid email, etc.) |
| `409` | Email already registered |
| `409` `ACCOUNT_PENDING_DELETION` | Email exists but account is in hard-deletion grace period; reactivation possible |
| `429` | Rate limit exceeded |

---

## Login

### `POST /auth/login`

Authenticate an existing vendor with email and password. Creates a server-tracked session.

**Rate Limit:** 10 requests / 60 s / IP

**Request Body:**

```json
{
  "email": "vendor@acme.com",
  "password": "SecurePass123!",
  "deviceId": "vendor-web-001"
}
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `email` | yes | valid email, max 255 chars |
| `password` | yes | 1–128 chars |
| `deviceId` | yes | stable device identifier, 4–128 chars |

**Response:**

```json
{
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "supabaseUserId": "d0b1c2d3-e4f5-6789-0123-456789abcdef",
    "email": "vendor@acme.com",
    "role": "vendor",
    "emailVerifiedAt": "2024-06-01T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "<opaque-or-jwt-refresh-token>",
  "expiresIn": 3600,
  "expiresAt": 1718186400,
  "sessionId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**cURL Example:**

```bash
curl -X POST https://api.barkosem.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: VendorWeb/1.0" \
  -d '{
    "email": "vendor@acme.com",
    "password": "SecurePass123!",
    "deviceId": "vendor-web-001"
  }'
```

**Error Codes:**

| Status | Meaning |
|--------|---------|
| `400` | Validation error |
| `401` | Invalid credentials |
| `403` `ACCOUNT_PENDING_DELETION` | Account is pending hard deletion; `details.deletionDueAt` is returned |
| `429` | Rate limit exceeded |

---

## Phone Registration

### `POST /auth/register/phone/initiate`

Send a 6-digit OTP via SMS to start phone-based registration.

**Rate Limit:** 3 requests / 60 s / IP

**Request Body:**

```json
{
  "phone": "+22670123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent",
  "expiresInSeconds": 600
}
```

**cURL Example:**

```bash
curl -X POST https://api.barkosem.com/api/v1/auth/register/phone/initiate \
  -H "Content-Type: application/json" \
  -d '{"phone": "+22670123456"}'
```

---

### `POST /auth/register/phone`

Register with phone and password **without** OTP.

**Rate Limit:** 5 requests / 60 s / IP

**Request Body:**

```json
{
  "phone": "+22670123456",
  "password": "SecurePass123!",
  "name": "Amina",
  "surname": "Sanou",
  "role": "vendor"
}
```

**Response:** Same token bundle as `POST /auth/login`.

---

### `POST /auth/register/phone/verify`

Verify the OTP and complete phone registration.

**Rate Limit:** 5 requests / 60 s / IP

**Request Body:**

```json
{
  "phone": "+22670123456",
  "code": "123456",
  "password": "SecurePass123!",
  "name": "Amina",
  "surname": "Sanou",
  "role": "vendor"
}
```

> Either `code` + `password` must be provided, or the backend may require both depending on the configured flow.

**Response:** Same token bundle as `POST /auth/login`.

---

## Phone Login

### `POST /auth/login/phone/initiate`

Send a 6-digit OTP for passwordless login.

**Rate Limit:** 3 requests / 60 s / IP

**Request Body:**

```json
{
  "phone": "+22670123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent",
  "expiresInSeconds": 600
}
```

---

### `POST /auth/login/phone`

Login with phone and password (no OTP).

**Rate Limit:** 10 requests / 60 s / IP

**Request Body:**

```json
{
  "phone": "+22670123456",
  "password": "SecurePass123!",
  "deviceId": "vendor-web-001"
}
```

**Response:** Same token bundle as `POST /auth/login`.

---

### `POST /auth/login/phone/verify`

Verify the OTP and complete phone login.

**Rate Limit:** 5 requests / 60 s / IP

**Request Body:**

```json
{
  "phone": "+22670123456",
  "code": "123456",
  "deviceId": "vendor-web-001"
}
```

**Response:** Same token bundle as `POST /auth/login`.

---

## Password Recovery

### `POST /auth/forgot-password`

Request a password-reset email. Always returns success to prevent email enumeration.

**Rate Limit:** 3 requests / 60 s / IP

**Request Body:**

```json
{
  "email": "vendor@acme.com"
}
```

**Response:**

```json
{
  "sent": true
}
```

**cURL Example:**

```bash
curl -X POST https://api.barkosem.com/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "vendor@acme.com"}'
```

---

### `POST /auth/reset-password`

Reset the password using the recovery token from the email link.

**Rate Limit:** 5 requests / 60 s / IP

**Request Body:**

```json
{
  "token": "recovery-token-from-email",
  "newPassword": "NewSecurePass456!"
}
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `token` | yes | recovery token, 6–4096 chars |
| `newPassword` | yes | 8–128 chars, 1 uppercase, 1 lowercase, 1 digit |

**Response:**

```json
{
  "success": true
}
```

After a successful reset, the vendor must log in again with the new password.

---

## Email Verification

### `POST /auth/resend-verification`

Resend the signup confirmation email. Always returns success.

**Rate Limit:** 3 requests / 60 s / IP

**Request Body:**

```json
{
  "email": "vendor@acme.com"
}
```

**Response:**

```json
{
  "sent": true
}
```

---

### `POST /auth/change-email`

Initiate an email address change. Requires the current password.

**Rate Limit:** 3 requests / 60 s / IP  
**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "newEmail": "newvendor@acme.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "sent": true,
  "message": "Please check your new email address to confirm the change."
}
```

The change is only applied after the vendor clicks the confirmation link in the new email.

**cURL Example:**

```bash
curl -X POST https://api.barkosem.com/api/v1/auth/change-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "newEmail": "newvendor@acme.com",
    "password": "SecurePass123!"
  }'
```

---

## Account Reactivation

### `POST /auth/reactivate`

Restore an account that is within the hard-deletion grace period.

**Rate Limit:** 5 requests / 60 s / IP

**Request Body:**

```json
{
  "email": "vendor@acme.com",
  "password": "SecurePass123!",
  "deviceId": "vendor-web-001"
}
```

`deviceId` is optional; a generated id is used if omitted.

**Response:** Same token bundle as `POST /auth/login`.

**cURL Example:**

```bash
curl -X POST https://api.barkosem.com/api/v1/auth/reactivate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendor@acme.com",
    "password": "SecurePass123!",
    "deviceId": "vendor-web-001"
  }'
```

---

## Current User

### `GET /auth/me`

Return the authenticated principal resolved from the Supabase JWT and the local database.

**Headers:** `Authorization: Bearer <access_token>`

**Response:**

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "supabaseUserId": "d0b1c2d3-e4f5-6789-0123-456789abcdef",
  "email": "vendor@acme.com",
  "role": "vendor",
  "emailVerifiedAt": "2024-06-01T10:00:00.000Z"
}
```

**cURL Example:**

```bash
curl -X GET https://api.barkosem.com/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## Session Management

### `POST /auth/sessions`

Register or refresh a server-tracked session for this device. Stores a hashed copy of the Supabase refresh token so the backend can orchestrate refresh and revocation.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "refreshToken": "<opaque-or-jwt-refresh-token>",
  "deviceId": "vendor-web-001",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `refreshToken` | yes | Supabase refresh token, 6–8192 chars |
| `deviceId` | yes | stable device identifier, 4–128 chars |
| `userAgent` | no | string, max 512 chars |

**Response:**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440001",
  "expiresAt": "2024-06-12T11:00:00.000Z"
}
```

> The backend enforces a maximum of **3 active sessions per user**. If a new session exceeds the limit, the oldest session is revoked automatically.

**cURL Example:**

```bash
curl -X POST https://api.barkosem.com/api/v1/auth/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "refreshToken": "<refresh-token-from-login>",
    "deviceId": "vendor-web-001",
    "userAgent": "VendorWeb/1.0"
  }'
```

---

### `POST /auth/refresh`

Exchange a refresh token for a new Supabase access token. The backend validates the server-side session binding first.

**Rate Limit:** 20 requests / 60 s / IP

**Request Body:**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440001",
  "refreshToken": "<current-refresh-token>"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "<new-refresh-token>",
  "expiresIn": 3600,
  "expiresAt": 1718190000,
  "sessionId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**cURL Example:**

```bash
curl -X POST https://api.barkosem.com/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440001",
    "refreshToken": "<current-refresh-token>"
  }'
```

---

### `POST /auth/logout`

Revoke the current server-tracked session. Requires the session id header.

**Headers:**

- `Authorization: Bearer <access_token>`
- `X-Session-Id: <session_id>`

**Response:**

```json
{
  "revoked": true
}
```

**cURL Example:**

```bash
curl -X POST https://api.barkosem.com/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Session-Id: 550e8400-e29b-41d4-a716-446655440001"
```

---

### `POST /auth/logout/all`

Revoke every tracked session for the current vendor (logout everywhere).

**Headers:** `Authorization: Bearer <access_token>`

**Response:**

```json
{
  "revoked": 5
}
```

**cURL Example:**

```bash
curl -X POST https://api.barkosem.com/api/v1/auth/logout/all \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## Recommended Session Flow

```text
1. POST /auth/register (role=vendor)
   → verify email via Supabase link

2. POST /auth/login
   → store accessToken, refreshToken, sessionId, expiresAt

3. POST /auth/sessions
   → bind refreshToken to backend session (required for refresh/logout)

4. Use accessToken in Authorization: Bearer header for every vendor API call.

5. Before accessToken expires:
   POST /auth/refresh { sessionId, refreshToken }
   → replace stored accessToken + refreshToken

6. On explicit logout:
   POST /auth/logout with X-Session-Id
```

---

## WebSocket Authentication

Vendor real-time events (orders, chat, notifications, vendor status updates) use Socket.IO at:

```text
wss://api.barkosem.com/realtime
```

Pass the JWT access token **and** the active `sessionId` in the `auth` handshake:

```javascript
import { io } from 'socket.io-client';

const socket = io('wss://api.barkosem.com/realtime', {
  auth: {
    token: accessToken,
    sessionId: sessionId,
  },
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('neoshop.order.updated', (payload) => {
  console.log('Order updated:', payload);
});

socket.on('neoshop.vendors.updated', (payload) => {
  console.log('Vendor status changed:', payload);
});
```

**Connection limits:**

- 20 connection attempts / 60 s / IP
- 5 connection attempts / 60 s / user
- The gateway rejects the connection if the session is revoked or expired.

---

## JavaScript Client Example

```javascript
const API_BASE = 'https://api.barkosem.com/api/v1';

async function api(path, options = {}) {
  const token = localStorage.getItem('accessToken');
  const sessionId = localStorage.getItem('sessionId');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(sessionId && path === '/auth/logout' && { 'X-Session-Id': sessionId }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.status === 204 ? null : res.json();
}

async function registerVendor(data) {
  return api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ...data, role: 'vendor' }),
  });
}

async function loginVendor(email, password, deviceId) {
  const result = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, deviceId }),
  });

  localStorage.setItem('accessToken', result.accessToken);
  localStorage.setItem('refreshToken', result.refreshToken);
  localStorage.setItem('sessionId', result.sessionId);
  localStorage.setItem('expiresAt', String(result.expiresAt));

  // Bind the session on the backend
  await api('/auth/sessions', {
    method: 'POST',
    body: JSON.stringify({
      refreshToken: result.refreshToken,
      deviceId,
      userAgent: navigator.userAgent,
    }),
  });

  return result;
}

async function refreshSession() {
  const sessionId = localStorage.getItem('sessionId');
  const refreshToken = localStorage.getItem('refreshToken');

  const result = await api('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ sessionId, refreshToken }),
  });

  localStorage.setItem('accessToken', result.accessToken);
  localStorage.setItem('refreshToken', result.refreshToken);
  localStorage.setItem('expiresAt', String(result.expiresAt));

  return result;
}

async function logoutVendor() {
  await api('/auth/logout', { method: 'POST' });
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('sessionId');
  localStorage.removeItem('expiresAt');
}

async function getCurrentUser() {
  return api('/auth/me');
}
```

---

## Error Reference

| Status | Code | Meaning |
|--------|------|---------|
| `400` | `Bad Request` | Validation error, invalid input, or business rule violation |
| `401` | `Unauthorized` | Missing/invalid JWT, invalid credentials, or refresh token mismatch |
| `403` | `Forbidden` | Insufficient permissions, suspended account, or account pending deletion |
| `404` | `Not Found` | User or session not found |
| `409` | `Conflict` | Email/phone already registered |
| `429` | `Too Many Requests` | Rate limit exceeded |
| `500` | `Internal Server Error` | Unexpected server error |

### Common Error Body

```json
{
  "statusCode": 400,
  "message": "Invalid request data. Please verify your input and try again.",
  "error": "Bad Request",
  "details": {
    "fields": [
      { "property": "email", "messages": ["email must be an email"] }
    ]
  },
  "path": "/api/v1/auth/login",
  "requestId": "req-uuid",
  "timestamp": "2024-06-12T10:00:00.000Z"
}
```

In production, 5xx responses omit internal `details` to avoid leaking sensitive information.
