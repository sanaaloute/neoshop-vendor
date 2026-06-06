# Barkosem Vendor Panel API Reference

**Base URL:** `https://api.neoshop.com/api/v1`  
**Target Client:** Next.js Vendor Panel  
**Authentication:** Supabase JWT Bearer tokens (`Authorization: Bearer <access_token>`)  
**Content-Type:** `application/json`

> **Role Requirement:** Most endpoints require `role=vendor`. Some endpoints are shared with customers (profile, notifications, etc.).

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User Profile](#2-user-profile)
3. [Vendor Profile & Onboarding](#3-vendor-profile--onboarding)
4. [Shops](#4-shops)
5. [Products](#5-products)
6. [Variants](#6-variants)
7. [Inventory](#7-inventory)
8. [Orders](#8-orders)
9. [Payments](#9-payments)
10. [Analytics](#10-analytics)
11. [Reviews](#11-reviews)
12. [Disputes](#12-disputes)
13. [Chat](#13-chat)
14. [Notifications & Push](#14-notifications--push)
15. [Storage](#15-storage)
16. [Wallet](#16-wallet)
17. [Reports](#17-reports)
18. [Shipping](#18-shipping)
19. [Product Q&A](#19-product-qa)
20. [Favorites](#20-favorites)
21. [Addresses](#21-addresses)
22. [Search](#22-search)
23. [Referrals](#23-referrals)
24. [Promotions](#24-promotions)
25. [Vendors (Public)](#25-vendors-public)
26. [Catalog (Public)](#26-catalog-public)

---

## 1. Authentication

> Vendors register with `role=vendor`.

### `GET /auth/v1/.well-known/jwks.json`
**Auth:** Public  
**Description:** Supabase Auth JWKS endpoint (proxied through Kong). Returns the public keys needed to verify ES256-signed JWT access tokens in frontend middleware (Next.js edge, SSR, or native app JWT validation).

**Response:**
```json
{
  "keys": [
    {
      "kty": "EC",
      "kid": "abc123def456",
      "use": "sig",
      "alg": "ES256",
      "crv": "P-256",
      "x": "base64url-encoded-x-coordinate",
      "y": "base64url-encoded-y-coordinate"
    }
  ]
}
```

**Frontend usage (Next.js middleware example):**
```typescript
import { jwtVerify, createLocalJWKSet } from 'jose';

// 1. Fetch JWKS from the gateway (never hit Supabase directly)
const jwksRes = await fetch('http://localhost:8000/auth/v1/.well-known/jwks.json');
const jwks = await jwksRes.json();
const keySet = createLocalJWKSet(jwks);

// 2. Verify the token
const { payload } = await jwtVerify(token, keySet, {
  issuer: 'https://vrfvhwjjittgldvvbetn.supabase.co/auth/v1',
  audience: 'authenticated',
  algorithms: ['ES256'],
});
```

> **Important:** The vendor panel must **not** talk to Supabase directly. Always fetch JWKS through the gateway (`/auth/v1/.well-known/jwks.json`). Kong proxies this to the Supabase Auth JWKS endpoint.

---

### `POST /auth/register`
**Auth:** Public  
**Description:** Email/password registration.

**Request:**
```json
{
  "email": "string",
  "password": "string",
  "name": "string?",
  "surname": "string?",
  "role": "vendor"
}
```

---

### `POST /auth/login`
**Auth:** Public  
**Description:** Email/password login.

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

---

### `POST /auth/register/phone/initiate`
**Auth:** Public  
**Description:** Initiate phone registration via OTP.

**Request:**
```json
{
  "phone": "+22670123456"
}
```

---

### `POST /auth/register/phone/verify`
**Auth:** Public  
**Description:** Verify OTP and complete phone registration.

**Request:**
```json
{
  "phone": "+22670123456",
  "code": "string",
  "password": "string",
  "name": "string?",
  "surname": "string?",
  "role": "vendor"
}
```

---

### `POST /auth/login/phone/initiate`
**Auth:** Public  
**Description:** Initiate phone login via OTP.

**Request:**
```json
{
  "phone": "+22670123456"
}
```

---

### `POST /auth/login/phone/verify`
**Auth:** Public  
**Description:** Verify OTP and complete phone login.

**Request:**
```json
{
  "phone": "+22670123456",
  "code": "string",
  "deviceId": "string?"
}
```

---

### `POST /auth/forgot-password`
**Auth:** Public  
**Description:** Request password reset email.

**Request:**
```json
{
  "email": "string"
}
```

---

### `POST /auth/reset-password`
**Auth:** Public  
**Description:** Reset password using recovery token.

**Request:**
```json
{
  "token": "string",
  "newPassword": "string"
}
```

---

### `GET /auth/me`
**Auth:** Bearer  
**Description:** Get current authenticated user.

---

### `POST /auth/sessions`
**Auth:** Bearer  
**Description:** Create a new auth session from a refresh token (multi-device tracking).

**Request:**
```json
{
  "refreshToken": "string",
  "deviceId": "string",
  "userAgent": "string?"
}
```

**Response:**
```json
{
  "sessionId": "string",
  "expiresAt": "2024-01-01T00:00:00Z"
}
```

---

### `POST /auth/refresh`
**Auth:** Public  
**Description:** Refresh access token.

**Request:**
```json
{
  "refreshToken": "string"
}
```

---

### `POST /auth/logout`
**Auth:** Bearer  
**Description:** Log out current session.

---

### `POST /auth/logout/all`
**Auth:** Bearer  
**Description:** Log out all sessions for the current user.

---

## 2. User Profile

### `GET /users/me`
**Auth:** Bearer  
**Description:** Get full profile of the current user.

**Response:**
```json
{
  "id": "uuid",
  "email": "string?",
  "phone": "string?",
  "name": "string?",
  "surname": "string?",
  "role": "vendor",
  "avatarUrl": "string?",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### `PATCH /users/me`
**Auth:** Bearer  
**Description:** Update current user profile.

**Request:**
```json
{
  "name": "string?",
  "surname": "string?",
  "avatarUrl": "string?"
}
```

**Response:** Updated user object.

---

### `GET /users/me/settings`
**Auth:** Bearer  
**Description:** Get user notification/settings preferences.

---

### `PATCH /users/me/settings`
**Auth:** Bearer  
**Description:** Update user settings.

**Request:**
```json
{
  "orderUpdates": "boolean?",
  "promoMessages": "boolean?",
  "emailNewsletter": "boolean?",
  "pushEnabled": "boolean?"
}
```

---

### `GET /users/me/viewed-products`
**Auth:** Bearer  
**Description:** Get recently viewed products.

---

### `POST /users/me/viewed-products`
**Auth:** Bearer  
**Description:** Record a product view.

**Request:**
```json
{
  "productId": "uuid"
}
```

---

## 3. Vendor Profile & Onboarding

### `POST /vendors/me/register`
**Auth:** Bearer (role=vendor)  
**Description:** Create the vendor profile for the authenticated seller account. Call once after registration.

**Request:**
```json
{
  "legalBusinessName": "string",
  "tradeName": "string?",
  "taxId": "string?",
  "businessEmail": "string?",
  "businessPhone": "string?",
  "countryCode": "string? // e.g. 'BF'",
  "region": "string?",
  "city": "string?",
  "addressLine1": "string?",
  "postalCode": "string?"
}
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "legalBusinessName": "string",
  "status": "PENDING_ONBOARDING",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### `GET /vendors/me`
**Auth:** Bearer (role=vendor)  
**Description:** Return vendor profile, documents, shops, and recent status history.

**Response:**
```json
{
  "id": "uuid",
  "legalBusinessName": "string",
  "tradeName": "string?",
  "status": "PENDING_ONBOARDING | PENDING_VERIFICATION | UNDER_REVIEW | APPROVED | REJECTED | SUSPENDED",
  "businessEmail": "string?",
  "businessPhone": "string?",
  "countryCode": "BF",
  "region": "string",
  "city": "string",
  "addressLine1": "string?",
  "documents": [
    { "id": "uuid", "type": "BUSINESS_REGISTRATION | TAX_CERTIFICATE | BANK_PROOF | IDENTITY | OTHER", "fileUrl": "string", "verifiedAt": "string?" }
  ],
  "shops": [
    { "id": "uuid", "slug": "string", "name": "string", "isPublished": true }
  ],
  "statusHistory": [
    { "status": "PENDING_ONBOARDING", "note": "string?", "createdAt": "2024-01-01T00:00:00Z" }
  ]
}
```

---

### `PATCH /vendors/me/onboarding`
**Auth:** Bearer (role=vendor)  
**Description:** Update onboarding fields while status allows edits.

**Request:** Same fields as `POST /vendors/me/register` (all optional).

**Response:** Updated vendor profile.

---

### `POST /vendors/me/documents`
**Auth:** Bearer (role=vendor)  
**Description:** Register a verification document (metadata only — upload file first via Storage API).

**Request:**
```json
{
  "type": "BUSINESS_REGISTRATION | TAX_CERTIFICATE | BANK_PROOF | IDENTITY | OTHER",
  "fileUrl": "string // URL from storage upload",
  "fileName": "string?"
}
```

**Response:** Created document object.

---

### `DELETE /vendors/me/documents/:documentId`
**Auth:** Bearer (role=vendor)  
**Description:** Remove a verification document before approval.

**Response:** `{ "deleted": true }`

---

### `POST /vendors/me/submit-verification`
**Auth:** Bearer (role=vendor)  
**Description:** Submit vendor profile for backend verification / approval workflow.

**Response:**
```json
{
  "success": true,
  "status": "PENDING_VERIFICATION"
}
```

---

## 4. Shops

### `POST /shops`
**Auth:** Bearer (role=vendor)  
**Description:** Create a shop for the authenticated vendor.

**Request:**
```json
{
  "slug": "string // unique URL-friendly identifier",
  "name": "string",
  "description": "string?",
  "logoUrl": "string?",
  "bannerUrl": "string?",
  "shippingConfig": "object? // structured shipping rules",
  "paymentConfig": "object? // payout configuration"
}
```

**Response:** Created shop object.

---

### `GET /shops/me`
**Auth:** Bearer (role=vendor)  
**Description:** List shops owned by the authenticated vendor.

**Response:**
```json
[
  {
    "id": "uuid",
    "slug": "my-shop",
    "name": "My Shop",
    "description": "string?",
    "logoUrl": "string?",
    "bannerUrl": "string?",
    "isPublished": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### `PATCH /shops/:shopId`
**Auth:** Bearer (role=vendor)  
**Description:** Update shop branding, shipping/payment configs, or publishing state.

**Request:** Same as POST (all fields optional).

**Response:** Updated shop object.

---

### `GET /shops/public/:slug`
**Auth:** Public  
**Description:** Read a published shop by slug (storefront-safe payload).

**Response:**
```json
{
  "id": "uuid",
  "slug": "my-shop",
  "name": "My Shop",
  "description": "string?",
  "logoUrl": "string?",
  "bannerUrl": "string?",
  "products": [ /* published products */ ]
}
```

---

## 5. Products

### `POST /products`
**Auth:** Bearer (role=vendor)  
**Description:** Create a vendor-owned product shell.

**Request:**
```json
{
  "title": "string",
  "slug": "string? // auto-generated if omitted",
  "description": "string?",
  "moq": "number? // default 1",
  "categoryIds": ["uuid?"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "string",
  "slug": "string",
  "status": "draft",
  "vendorId": "uuid",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### `GET /products/me`
**Auth:** Bearer (role=vendor)  
**Description:** List products owned by the authenticated vendor.

**Query Params:**
- `status` — `draft | pending_review | published | hidden | archived | rejected`
- `search` — case-insensitive title search
- `skip` — pagination offset (default 0)
- `take` — page size (default 24, max 100)

**Response:** Paginated list of product summaries.

---

### `GET /products/me/stats`
**Auth:** Bearer (role=vendor)  
**Description:** Product count breakdown by status.

**Response:**
```json
{
  "draft": 5,
  "pending_review": 2,
  "published": 12,
  "hidden": 1,
  "archived": 3,
  "rejected": 0
}
```

---

### `GET /products/:productId`
**Auth:** Bearer (role=vendor)  
**Description:** Fetch full product detail including dynamic attributes and variants.

**Response:** Same as catalog product detail but includes draft/private fields.

---

### `PATCH /products/:productId`
**Auth:** Bearer (role=vendor)  
**Description:** Update product descriptors, lifecycle status, or MOQ defaults.

**Request:**
```json
{
  "title": "string?",
  "description": "string?",
  "moq": "number?",
  "status": "draft | pending_review | published | hidden | archived?"
}
```

**Response:** Updated product.

---

### `DELETE /products/:productId`
**Auth:** Bearer (role=vendor)  
**Description:** Delete a product and all nested catalog rows.

**Response:** `{ "deleted": true }`

---

### `POST /products/:productId/attributes`
**Auth:** Bearer (role=vendor)  
**Description:** Define a dynamic attribute dimension (e.g., Color, Size).

**Request:**
```json
{
  "code": "color",
  "label": "Color",
  "sortOrder": 0
}
```

**Response:** Created attribute object.

---

### `POST /products/:productId/attributes/:attributeId/values`
**Auth:** Bearer (role=vendor)  
**Description:** Append selectable values for an existing attribute.

**Request:**
```json
{
  "value": "Red",
  "sortOrder": 0
}
```

**Response:** Created value object.

---

### `DELETE /products/:productId/attributes/:attributeId`
**Auth:** Bearer (role=vendor)  
**Description:** Remove an attribute dimension and all its values.

**Response:** `{ "deleted": true }`

---

### `DELETE /products/:productId/attributes/:attributeId/values/:valueId`
**Auth:** Bearer (role=vendor)  
**Description:** Remove a single attribute value.

**Response:** `{ "deleted": true }`

---

### `POST /products/:productId/media`
**Auth:** Bearer (role=vendor)  
**Description:** Attach product media via HTTPS URL metadata.

**Request:**
```json
{
  "url": "string",
  "alt": "string?",
  "isPrimary": "boolean?",
  "sortOrder": 0
}
```

**Response:** Created media object.

---

### `DELETE /products/:productId/media/:mediaId`
**Auth:** Bearer (role=vendor)  
**Description:** Remove a media asset reference.

**Response:** `{ "deleted": true }`

---

### `PUT /products/:productId/categories`
**Auth:** Bearer (role=vendor)  
**Description:** Replace category assignments for a product.

**Request:**
```json
{
  "categoryIds": ["uuid", "uuid"]
}
```

**Response:** Updated product with categories.

---

## 6. Variants

### `GET /products/:productId/variants`
**Auth:** Bearer (role=vendor)  
**Description:** List variants for a product.

**Response:**
```json
[
  {
    "id": "uuid",
    "sku": "string",
    "wholesalePrice": 12500.00,
    "moq": 10,
    "isActive": true,
    "selections": [
      { "attributeCode": "color", "value": "Red" }
    ]
  }
]
```

---

### `POST /products/:productId/variants`
**Auth:** Bearer (role=vendor)  
**Description:** Create a dynamically composed variant (SKU auto-generated if omitted).

**Request:**
```json
{
  "sku": "string?",
  "wholesalePrice": 12500.00,
  "moq": "number?",
  "selectionIds": ["uuid", "uuid"],
  "bulkPricing": [
    { "minQuantity": 50, "price": 11000.00 }
  ]
}
```

**Response:** Created variant object.

---

### `PATCH /products/:productId/variants/:variantId`
**Auth:** Bearer (role=vendor)  
**Description:** Update pricing, MOQ overrides, bulk tiers, or activation state.

**Request:** Same as POST (all optional).

**Response:** Updated variant.

---

### `DELETE /products/:productId/variants/:variantId`
**Auth:** Bearer (role=vendor)  
**Description:** Delete a variant and its inventory row.

**Response:** `{ "deleted": true }`

---

## 7. Inventory

### `GET /inventory/variants/:variantId`
**Auth:** Bearer (role=vendor)  
**Description:** Read variant stock snapshot.

**Response:**
```json
{
  "id": "uuid",
  "variantId": "uuid",
  "quantity": 500,
  "reservedQuantity": 25
}
```

---

### `PATCH /inventory/variants/:variantId`
**Auth:** Bearer (role=vendor)  
**Description:** Set absolute on-hand quantity.

**Request:**
```json
{
  "quantity": 1000
}
```

**Response:** Updated inventory row.

---

### `POST /inventory/variants/:variantId/adjust`
**Auth:** Bearer (role=vendor)  
**Description:** Apply a stock delta (restock or decrement).

**Request:**
```json
{
  "delta": 50
}
```

**Response:** Updated inventory row.

---

## 8. Orders

### `GET /orders/vendor`
**Auth:** Bearer (role=vendor)  
**Description:** List orders for the authenticated vendor.

**Response:** Array of order summaries (no pagination params).

---

### `GET /orders/vendor/stats`
**Auth:** Bearer (role=vendor)  
**Description:** Order count breakdown by status.

**Response:**
```json
{
  "pending": 3,
  "paid": 5,
  "processing": 2,
  "shipped": 8,
  "delivered": 15,
  "disputed": 1,
  "refunded": 0,
  "cancelled": 2
}
```

---

### `GET /orders/vendor/customers`
**Auth:** Bearer (role=vendor)  
**Description:** List unique customers who ordered from this vendor.

**Response:** Array of customer objects with order counts.

---

### `GET /orders/:orderId`
**Auth:** Bearer (role=vendor, own orders only)  
**Description:** Order detail with items, timeline, invoices, payments, refunds.

**Response:** Full order object.

---

### `GET /orders/:orderId/tracking`
**Auth:** Bearer (role=vendor)  
**Description:** Get tracking events for an order.

**Response:** Array of tracking events.

---

### `PATCH /orders/:orderId/status`
**Auth:** Bearer (role=vendor)  
**Description:** Update order status (fulfillment workflow). Accepts any `OrderStatus` value; business rules enforce valid transitions per role.

**Request:**
```json
{
  "status": "pending | paid | processing | shipped | delivered | disputed | refunded | cancelled",
  "note": "string? // e.g. tracking number"
}
```

**Response:** Updated order with new status history entry.

---

## 9. Payments

### `GET /payments/methods`
**Auth:** Bearer  
**Description:** List available payment methods.

**Response:** Array of payment method objects.

---

## 10. Analytics

### `GET /vendors/me/analytics/dashboard`
**Auth:** Bearer (role=vendor)  
**Description:** Vendor dashboard KPIs and top products.

**Response:**
```json
{
  "totalRevenue": 1250000.00,
  "totalOrders": 45,
  "averageOrderValue": 27777.78,
  "topProducts": [
    { "productId": "uuid", "title": "string", "soldCount": 120 }
  ],
  "period": "last_30_days"
}
```

---

### `GET /vendors/me/analytics/orders`
**Auth:** Bearer (role=vendor)  
**Description:** Vendor order trends over time.

**Query Params:**
- `days` — number (default 30)

**Response:**
```json
[
  {
    "date": "2024-01-01",
    "orderCount": 5,
    "revenue": 150000.00
  }
]
```

---

### `GET /vendors/me/analytics/products`
**Auth:** Bearer (role=vendor)  
**Description:** Vendor product performance summary.

**Response:**
```json
[
  {
    "productId": "uuid",
    "title": "string",
    "views": 150,
    "orders": 12,
    "conversionRate": 8.0
  }
]
```

---

## 11. Reviews

### `GET /vendors/me/reviews`
**Auth:** Bearer (role=vendor)  
**Description:** List reviews on products owned by this vendor.

**Response:** Array of review objects with product info (max 100, most recent first).

---

### `POST /vendors/me/reviews/:reviewId/response`
**Auth:** Bearer (role=vendor)  
**Description:** Respond to a review as the vendor.

**Request:**
```json
{
  "response": "string // vendor response text"
}
```

**Response:** Updated review with vendor response.

---

## 12. Disputes

### `GET /vendors/me/disputes`
**Auth:** Bearer (role=vendor)  
**Description:** List disputes for orders placed with this vendor.

**Response:**
```json
[
  {
    "id": "uuid",
    "orderId": "uuid",
    "status": "open | investigating | awaiting_customer | awaiting_vendor | mediation | escalated | resolved",
    "amountClaimed": 50000.00,
    "currency": "XOF",
    "reasonCategory": "string",
    "openedAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### `GET /vendors/me/disputes/:disputeId`
**Auth:** Bearer (role=vendor)  
**Description:** Get dispute detail (vendor view).

**Response:** Dispute with messages and timeline.

---

### `POST /vendors/me/disputes/:disputeId/messages`
**Auth:** Bearer (role=vendor)  
**Description:** Post a message in a dispute.

**Request:**
```json
{
  "body": "string"
}
```

**Response:** Created message.

---

## 13. Chat

### `GET /chat/conversations`
**Auth:** Bearer  
**Description:** List conversations for the authenticated user.

**Response:** Array of conversation summaries.

---

### `POST /chat/conversations`
**Auth:** Bearer  
**Description:** Open or resume a conversation with a customer.

**Request:**
```json
{
  "withUserId": "uuid // other participant user ID"
}
```

**Response:** Conversation object.

---

### `GET /chat/conversations/:conversationId`
**Auth:** Bearer  
**Description:** Get conversation details.

---

### `GET /chat/conversations/:conversationId/messages`
**Auth:** Bearer  
**Description:** List messages in a conversation.

**Query Params:**
- `skip` — pagination offset (default 0)
- `take` — page size (default 50, max 100)

**Response:** Array of messages.

---

### `POST /chat/conversations/:conversationId/messages`
**Auth:** Bearer  
**Description:** Send a message in a conversation.

**Request:**
```json
{
  "body": "string"
}
```

**Response:** Created message.

---

## 14. Notifications & Push

### `GET /notifications`
**Auth:** Bearer  
**Description:** List notifications for the authenticated user.

**Query Params:**
- `skip` — pagination offset (default 0)
- `take` — page size (default 50, max 200)
- `unreadOnly` — `true` to show only unread notifications

---

### `GET /notifications/unread-count`
**Auth:** Bearer  
**Description:** Get unread notification count.

**Response:**
```json
{
  "count": 5
}
```

---

### `PATCH /notifications/:notificationId`
**Auth:** Bearer  
**Description:** Update a notification (e.g., mark as read).

**Request:**
```json
{
  "read": true
}
```

---

### `POST /notifications/read-all`
**Auth:** Bearer  
**Description:** Mark all notifications as read.

---

### `POST /notifications/devices/register`
**Auth:** Bearer  
**Description:** Register a device push token (FCM / APNs).

**Request:**
```json
{
  "token": "string",
  "platform": "android | ios | web",
  "deviceId": "string?",
  "appVersion": "string?"
}
```

---

### `POST /notifications/devices/:token/heartbeat`
**Auth:** Bearer  
**Description:** Signal that a device token is still active.

---

### `DELETE /notifications/devices/:token`
**Auth:** Bearer  
**Description:** Unregister a device push token.

---

## 15. Storage

### `POST /storage/upload`
**Auth:** Bearer  
**Description:** Upload a single file (multipart/form-data).

**Form Data:**
- `file` — binary
- `bucket` — enum (`products`, `shops`, `avatars`, `documents`, `chat-media`, `temp`)
- `entityId` — uuid
- `type` — string (e.g., `main`, `gallery_1`, `avatar`, `logo`)
- `subEntityId` — uuid? (required when bucket is `chat-media`)

**Response:** Uploaded file metadata with public URL.

---

### `POST /storage/upload/batch`
**Auth:** Bearer  
**Description:** Upload multiple files in one request (multipart/form-data).

**Form Data:**
- `files` — array of binaries
- `bucket`, `entityId`, `type`, `subEntityId` (same semantics as single upload)

---

### `POST /storage/read-urls`
**Auth:** Bearer  
**Description:** Batch-resolve public/read URLs for stored objects.

**Request:**
```json
{
  "items": [
    { "bucket": "products", "path": "uuid/filename.jpg" }
  ]
}
```

---

### `GET /storage/signed-url`
**Auth:** Bearer  
**Description:** Generate a temporary signed URL for a private object.

**Query Params:**
- `bucket` — string
- `path` — string

---

### `DELETE /storage`
**Auth:** Bearer  
**Description:** Delete a stored object.

**Request:**
```json
{
  "bucket": "products",
  "path": "uuid/filename.jpg"
}
```

---

## 16. Wallet

### `GET /wallet/me`
**Auth:** Bearer  
**Description:** Get current user's wallet balance.

---

### `GET /wallet/me/transactions`
**Auth:** Bearer  
**Description:** List wallet transactions.

---

## 17. Reports

### `POST /reports`
**Auth:** Bearer  
**Description:** Submit a report (user, vendor, or content).

**Request:**
```json
{
  "reportedUserId": "uuid?",
  "reportedVendorId": "uuid?",
  "category": "harassment | fraud | spam | inappropriate_content | order_issue | other",
  "details": "string"
}
```

---

### `GET /reports/me`
**Auth:** Bearer  
**Description:** List reports submitted by the current user.

---

## 18. Shipping

### `GET /shipping/methods`
**Auth:** Bearer  
**Description:** List available shipping methods.

---

### `POST /shipping/rates`
**Auth:** Bearer  
**Description:** Calculate shipping rates for a cart/address.

**Request:**
```json
{
  "addressId": "uuid?",
  "items": [
    { "variantId": "uuid", "quantity": 2 }
  ]
}
```

---

## 19. Product Q&A

> Shared endpoint — vendors can answer questions on their products.

### `GET /products/:productId/qa`
**Auth:** Bearer  
**Description:** List Q&A threads for a product.

---

### `POST /products/:productId/qa`
**Auth:** Bearer  
**Description:** Ask a question on a product.

**Request:**
```json
{
  "question": "string"
}
```

---

### `POST /qa/:threadId/answers`
**Auth:** Bearer  
**Description:** Answer a Q&A thread.

**Request:**
```json
{
  "answer": "string"
}
```

---

## 20. Favorites

### `GET /favorites/products`
**Auth:** Bearer  
**Description:** List favorited products for the current user.

---

### `POST /favorites/products`
**Auth:** Bearer  
**Description:** Add a product to favorites.

**Request:**
```json
{
  "productId": "uuid"
}
```

---

### `DELETE /favorites/products/:productId`
**Auth:** Bearer  
**Description:** Remove a product from favorites.

---

## 21. Addresses

### `GET /addresses`
**Auth:** Bearer  
**Description:** List addresses for the current user.

---

### `POST /addresses`
**Auth:** Bearer  
**Description:** Create a new address.

**Request:**
```json
{
  "label": "string",
  "street": "string",
  "city": "string",
  "region": "string?",
  "postalCode": "string?",
  "country": "string",
  "phone": "string?",
  "isDefault": "boolean?"
}
```

---

### `PATCH /addresses/:addressId`
**Auth:** Bearer  
**Description:** Update an address.

**Request:** Same as POST (all optional).

---

### `DELETE /addresses/:addressId`
**Auth:** Bearer  
**Description:** Delete an address.

---

## 22. Search

### `GET /search/suggestions`
**Auth:** Bearer  
**Description:** Get search suggestions.

**Query Params:**
- `q` — search string

---

### `GET /search/trending`
**Auth:** Bearer  
**Description:** Get trending search terms.

---

### `GET /search/history`
**Auth:** Bearer  
**Description:** Get personal search history.

---

### `POST /search/history`
**Auth:** Bearer  
**Description:** Record a search query in history.

**Request:**
```json
{
  "query": "string"
}
```

---

### `DELETE /search/history`
**Auth:** Bearer  
**Description:** Clear personal search history.

---

## 23. Referrals

### `GET /referrals/me`
**Auth:** Bearer  
**Description:** Get referral status and rewards for the current user.

---

### `POST /referrals/redeem`
**Auth:** Bearer  
**Description:** Redeem a referral code.

**Request:**
```json
{
  "code": "string"
}
```

---

## 24. Promotions

### `POST /coupons/validate`
**Auth:** Bearer  
**Description:** Validate a coupon code.

**Request:**
```json
{
  "code": "string",
  "cartId": "uuid?"
}
```

---

### `GET /promotions/active`
**Auth:** Bearer  
**Description:** List currently active promotions.

---

## 25. Vendors (Public)

### `GET /vendors/public`
**Auth:** Public  
**Description:** List public vendor profiles for discovery.

---

### `GET /vendors/public/:vendorId`
**Auth:** Public  
**Description:** Get public vendor profile details.

---

## 26. Catalog (Public)

> Useful for vendor panel product preview and public browsing.

### `GET /catalog/products`
**Auth:** Public  
**Description:** List published products.

**Query Params:**
- `categoryId` — filter by category UUID
- `shopSlug` — filter by published shop slug
- `search` — case-insensitive title search
- `skip` — pagination offset (default 0)
- `take` — page size (default 24, max 48)

---

### `GET /catalog/products/:productId`
**Auth:** Public  
**Description:** Get published product detail.

---

### `POST /catalog/products/compare`
**Auth:** Public  
**Description:** Compare multiple products side-by-side.

**Request:**
```json
{
  "productIds": ["uuid", "uuid"]
}
```

---

### `GET /categories`
**Auth:** Public  
**Description:** List product categories.

---

## Common Errors

| Status | Meaning | Typical Cause |
|--------|---------|---------------|
| `400` | Bad Request | Invalid input |
| `401` | Unauthorized | Missing/invalid token |
| `403` | Forbidden | Not a vendor, or not owner of resource |
| `404` | Not Found | Product/shop/order not found |
| `409` | Conflict | Duplicate slug, SKU, etc. |
| `422` | Unprocessable | Business rule violation |
| `500` | Server Error | Internal failure |
