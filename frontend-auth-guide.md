# NeoShop — Frontend Authentication Guide

> **Target audience:** Frontend developers building the customer mobile app, vendor panel, and admin console.

---

## Architecture Overview

| Layer | Responsibility |
|-------|---------------|
| **Kong Gateway** | Reverse proxy, SSL, rate limiting. All requests go through `https://api.barkosem.com`. |
| **Supabase Auth** | Identity provider. Handles JWT issuance, email/phone OTP, password resets, email verification. |
| **Backend (NestJS)** | Local user records, role enforcement, server-tracked sessions, business logic. |

**Key rule:** The backend validates Supabase JWTs. Never call Supabase Auth endpoints directly from the browser for operations that create local users (registration, bootstrap). Always go through the backend API.

---

## Common Concepts

### Headers Required on Every Authenticated Request

```http
Authorization: Bearer <supabase_access_token>
x-session-id: <server_session_id>
```

- `Authorization` — Supabase JWT (short-lived, ~1 hour).
- `x-session-id` — Server-tracked session UUID returned at login. Required on all protected endpoints plus logout.

### Device ID

All login endpoints now **require** a stable `deviceId` (4–128 chars). Generate this once per app install and store it in `localStorage` / `AsyncStorage` / `Keychain`:

```ts
// Example
const deviceId = localStorage.getItem('deviceId') || crypto.randomUUID();
localStorage.setItem('deviceId', deviceId);
```

**Why?** The backend enforces a **maximum of 3 active sessions per user**. If the user logs in on a 4th device, the oldest session is revoked. Without a stable deviceId, every login creates a new session and pushes out the previous one.

### Password Requirements

All passwords must satisfy:
- Minimum 8 characters
- At least 1 uppercase letter (`A-Z`)
- At least 1 lowercase letter (`a-z`)
- At least 1 digit (`0-9`)

### Role Self-Registration Rules

| Role | Self-registration allowed? | Notes |
|------|---------------------------|-------|
| `customer` | ✅ Yes | Default if no role is provided |
| `vendor` | ✅ Yes | Pass `role: "vendor"` during registration |
| `admin` | ❌ No | Downgraded to `customer` if attempted |
| `super_admin` | ❌ No | Downgraded to `customer` if attempted |

---

## Part 1 — Customer & Vendor Authentication

### 1.1 Email Registration

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John",
  "surname": "Doe",
  "role": "customer"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Account created. Please check your email to verify your account before logging in.",
  "user": {
    "userId": "uuid",
    "supabaseUserId": "uuid",
    "email": "user@example.com",
    "role": "customer"
  }
}
```

**Frontend flow:**
1. Call `POST /auth/register`
2. Show a "Check your email" screen — **do NOT attempt to auto-login**
3. Supabase sends a verification email automatically
4. User clicks the link in their email → Supabase redirects to your `SITE_URL` with a confirmation token
5. Your frontend at `SITE_URL` can exchange the token for a Supabase session using the Supabase client SDK, **OR** simply tell the user to log in manually
6. Once the email is verified, the user can log in via `POST /auth/login`

**Important:** If the user tries to log in before verifying their email, the backend returns:
```json
{ "statusCode": 401, "message": "Email not verified. Please check your inbox and confirm your email before logging in." }
```

---

### 1.2 Email Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "deviceId": "stable-device-uuid"
}
```

**Response (200):**
```json
{
  "user": { "userId": "...", "supabaseUserId": "...", "email": "...", "role": "customer" },
  "accessToken": "eyJhbGc...",
  "refreshToken": " opaque-or-jwt-refresh-token ",
  "expiresIn": 3600,
  "expiresAt": 1717171717,
  "sessionId": "server-session-uuid"
}
```

**Frontend flow:**
1. Store `accessToken`, `refreshToken`, and `sessionId` securely
2. Attach to every subsequent request:
   ```http
   Authorization: Bearer <accessToken>
   x-session-id: <sessionId>
   ```
3. When `accessToken` expires (~1 hour), call `POST /auth/refresh` to get a new one

---

### 1.3 Phone Registration

Phone registration uses Supabase's native OTP — no custom SMS handling needed.

**Step 1 — Request OTP:**
```http
POST /api/v1/auth/register/phone/initiate
Content-Type: application/json

{ "phone": "+22670123456" }
```

**Response (200):**
```json
{ "success": true, "message": "OTP sent", "expiresInSeconds": 600 }
```

**Step 2 — Verify OTP & complete registration:**
```http
POST /api/v1/auth/register/phone/verify
Content-Type: application/json

{
  "phone": "+22670123456",
  "code": "123456",
  "password": "SecurePass123",
  "name": "John",
  "surname": "Doe",
  "role": "vendor"
}
```

**Response (200):** Same as email login — returns tokens and session.

**Notes:**
- `password` is optional. If omitted, the user can only log in via phone OTP (passwordless).
- If provided, the password is set so the user can also log in with email/password later.

---

### 1.4 Phone Login

**Step 1 — Request OTP:**
```http
POST /api/v1/auth/login/phone/initiate
Content-Type: application/json

{ "phone": "+22670123456" }
```

**Step 2 — Verify OTP:**
```http
POST /api/v1/auth/login/phone/verify
Content-Type: application/json

{
  "phone": "+22670123456",
  "code": "123456",
  "deviceId": "stable-device-uuid"
}
```

**Response (200):** Same as email login — returns tokens and session.

---

### 1.5 Password Recovery (Email Only)

**Step 1 — Request reset:**
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{ "email": "user@example.com" }
```

**Response (200):**
```json
{ "sent": true }
```

Always returns success — does not leak whether the email exists.

**Step 2 — User receives email from Supabase:**
- The reset link redirects to your `SITE_URL` with a recovery token
- Your frontend extracts the token from the URL query params

**Step 3 — Submit new password:**
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "recovery-token-from-url",
  "newPassword": "NewSecurePass456"
}
```

**Response (200):**
```json
{ "success": true }
```

**Frontend flow after reset:** Redirect the user to the login screen. They must log in again with the new password.

---

## Part 2 — Admin Authentication

Admin accounts **cannot** be self-registered through `/api/v1/auth/register`. There is a one-time bootstrap process.

### 2.1 Check Bootstrap Status

```http
GET /api/v1/setup/status
```

**Response (200):**
```json
{
  "bootstrapAvailable": true,
  "setupTokenRequired": false
}
```

- `bootstrapAvailable: true` — No admin exists yet; bootstrap is allowed **once**.
- `setupTokenRequired: true` — The server has `ADMIN_SETUP_SECRET` configured; you must pass `setupToken` in the bootstrap request.

### 2.2 Bootstrap the First Admin

```http
POST /api/v1/setup/bootstrap-admin
Content-Type: application/json

{
  "email": "admin@barkosem.com",
  "password": "VeryStrongPass123!",
  "name": "Super",
  "surname": "Admin",
  "phone": "+22670123456",
  "setupToken": "optional-secret-if-configured"
}
```

**Response (201):**
```json
{
  "supabaseUserId": "uuid",
  "email": "admin@barkosem.com"
}
```

**Frontend flow:**
1. Call `GET /setup/status` to check if bootstrap is available
2. Show the bootstrap form only if `bootstrapAvailable === true`
3. Collect email, password (min 12 chars for admin), name, surname, optional phone
4. If `setupTokenRequired === true`, prompt for the setup token (provided by devops/infrastructure team)
5. Call `POST /setup/bootstrap-admin`
6. After success, redirect to login
7. The admin logs in via **email login** (`POST /auth/login`) exactly like any other user
8. Then registers the server session (`POST /auth/sessions`)

**Important:** After the first admin is created, `bootstrapAvailable` becomes `false` forever. Additional admins must be created by existing admins through the admin console.

---

## Part 3 — Session Management

### 3.1 Register / Refresh a Server Session

After login (or when the app restarts and you have a Supabase refresh token), register the session with the backend:

```http
POST /api/v1/auth/sessions
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "refreshToken": "<supabase_refresh_token>",
  "deviceId": "stable-device-uuid",
  "userAgent": "NeoShopApp/1.0"
}
```

**Response (200):**
```json
{
  "sessionId": "server-session-uuid",
  "expiresAt": "2025-06-01T12:00:00.000Z"
}
```

### 3.2 Refresh an Expired Access Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "sessionId": "server-session-uuid",
  "refreshToken": "<current_supabase_refresh_token>"
}
```

**Response (200):**
```json
{
  "accessToken": "new-jwt...",
  "refreshToken": "new-refresh...",
  "expiresIn": 3600,
  "expiresAt": 1717175317,
  "sessionId": "server-session-uuid"
}
```

**When to call:** Before any authenticated request if the `accessToken` is expired (or proactively ~5 minutes before expiry).

### 3.3 Logout

**Logout current device:**
```http
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
x-session-id: <sessionId>
```

**Logout all devices:**
```http
POST /api/v1/auth/logout/all
Authorization: Bearer <accessToken>
x-session-id: <sessionId>
```

---

## Part 4 — Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /auth/register` | 5 | 60 seconds |
| `POST /auth/login` | 10 | 60 seconds |
| `POST /auth/register/phone/initiate` | 3 | 60 seconds |
| `POST /auth/login/phone/initiate` | 3 | 60 seconds |
| `POST /auth/register/phone/verify` | 5 | 60 seconds |
| `POST /auth/login/phone/verify` | 5 | 60 seconds |
| `POST /auth/forgot-password` | 3 | 60 seconds |
| `POST /auth/reset-password` | 5 | 60 seconds |
| `POST /auth/refresh` | 20 | 60 seconds |

If a limit is exceeded, the backend returns `429 Too Many Requests`:
```json
{ "statusCode": 429, "message": "Too many requests — slow down and retry." }
```

**Brute-force protection:** After 5 failed login attempts (email or phone) within 15 minutes, the account is blocked for 15 minutes with:
```json
{ "statusCode": 401, "message": "Too many failed attempts. Please try again in 15 minute(s)." }
```

---

## Part 5 — Error Reference

| Scenario | HTTP Status | Message |
|----------|-------------|---------|
| Invalid credentials | 401 | `Invalid credentials` |
| Email not verified | 401 | `Email not verified. Please check your inbox and confirm your email before logging in.` |
| Account suspended | 401 | `Account is suspended` |
| Account already exists | 409 | `Account already exists` |
| Too many failed attempts | 401 | `Too many failed attempts. Please try again in X minute(s).` |
| Rate limit exceeded | 429 | `Too many requests — slow down and retry.` |
| Session not found | 401 | `Session not found or revoked` |
| Missing session header | 401 | `Missing session header` |

---

## Quick Reference: Which Flow to Use?

| User Type | Registration | Login | Password Reset |
|-----------|-------------|-------|----------------|
| **Customer / Vendor** | Email (with verification) OR Phone OTP | Email + password OR Phone OTP | Email link via `/auth/forgot-password` |
| **Admin** | One-time bootstrap (`/setup/bootstrap-admin`) only | Email + password | Email link via `/auth/forgot-password` |

---

## Summary Checklist for Frontend Implementation

- [ ] Generate and persist a **stable `deviceId`** per app install
- [ ] Email registration: show "check your email" screen; do not auto-login
- [ ] Email login: handle the "email not verified" error explicitly
- [ ] Phone registration/login: use Supabase-native OTP flow through backend
- [ ] Attach `Authorization: Bearer <token>` + `x-session-id: <sessionId>` to all authenticated requests
- [ ] Implement token refresh before expiry
- [ ] Implement logout (current device + logout all)
- [ ] Admin console: implement bootstrap flow with setup token support
- [ ] Handle 429 rate limit errors with user-friendly retry UI
