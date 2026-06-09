# NeoShop — Complete Vendor API Reference

> **Base URL:** `https://api.barkosem.com/api/v1`  
> **Auth:** Supabase JWT Bearer token (`Authorization: Bearer <access_token>`)  
> **Version:** `v1`

Vendors **also** have access to many customer endpoints (`/auth/me`, `/wallet/me`, `/chat`, `/addresses`, `/shipping`, etc.) — those are listed in the *Shared Endpoints* section at the bottom of this doc. Some endpoints (cart, checkout, returns, RFQ, customer reviews) are restricted to the `customer` role and require a separate customer account.

---

## Vendor Profile

### `GET /vendors/me`

**Auth:** `vendor` role + `VENDOR_PROFILE_WRITE`

**Response:** Vendor profile, documents, shops, and recent status history.

---

### `POST /vendors/me/register`

**Auth:** `vendor` role + `VENDOR_PROFILE_WRITE`

**Body:** `RegisterVendorDto`
```json
{
  "vendorType": "INDIVIDUAL" | "COMPANY",
  "legalBusinessName": "string (2-200 chars)",
  "tradeName?": "string",
  "taxId?": "string",
  "businessEmail?": "email",
  "businessPhone?": "string",
  "countryCode?": "ISO-3166-1 alpha-2 (2 chars)"
}
```

---

### `PATCH /vendors/me/onboarding`

**Auth:** `VENDOR_PROFILE_WRITE`

**Body:** `UpdateVendorOnboardingDto` (all optional)
```json
{
  "vendorType?": "INDIVIDUAL" | "COMPANY",
  "legalBusinessName?": "string",
  "tradeName?": "string",
  "taxId?": "string",
  "businessEmail?": "email",
  "businessPhone?": "string",
  "countryCode?": "string (2 chars)",
  "region?": "string",
  "city?": "string",
  "addressLine1?": "string",
  "postalCode?": "string"
}
```

**Note:** Some fields may be locked after admin approval.

---

### `POST /vendors/me/documents`

**Auth:** `VENDOR_PROFILE_WRITE`

**Body:** `CreateVendorDocumentDto`
```json
{
  "type": "ID_CARD" | "BUSINESS_LICENSE" | "TAX_DOCUMENT" | "ADDRESS_PROOF" | "OTHER",
  "fileUrl": "https://...",
  "storageBucket?": "vendor-documents",
  "storagePath?": "object/path",
  "fileName?": "string",
  "mimeType?": "string"
}
```

---

### `DELETE /vendors/me/documents/:documentId`

**Auth:** `VENDOR_PROFILE_WRITE`

---

### `POST /vendors/me/submit-verification`

**Auth:** `VENDOR_PROFILE_WRITE`

**Note:** Submits vendor profile for backend verification / approval workflow.

---

## Shop Management

### `POST /shops`

**Auth:** `vendor` role + `VENDOR_SHOPS_WRITE`

**Body:** `CreateShopDto`
```json
{
  "slug": "lowercase-slug",
  "name": "Shop Name",
  "description?": "string (max 4000)"
}
```

---

### `GET /shops/me`

**Auth:** `VENDOR_SHOPS_WRITE`

**Response:** Shops owned by the authenticated vendor.

---

### `GET /shops/public/:slug`

**Auth:** Public (no JWT required)

**Response:** Published shop payload (storefront-safe).

---

### `PATCH /shops/:shopId`

**Auth:** `VENDOR_SHOPS_WRITE` — only for shops owned by this vendor

**Body:** `UpdateShopDto` (all optional)
```json
{
  "slug?": "string",
  "name?": "string",
  "description?": "string",
  "logoUrl?": "https://...",
  "bannerUrl?": "https://...",
  "shippingConfig?": { ... },
  "paymentConfig?": { ... },
  "isPublished?": true | false
}
```

---

## Products

### `POST /products`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Body:** `CreateProductDto`
```json
{
  "title": "Product Title",
  "slug": "product-slug",
  "description?": "string (max 20000)",
  "moq?": 1,
  "bulkPricing?": [
    { "minQuantity": 100, "unitPrice": 20.00 }
  ],
  "categoryIds?": ["uuid"]
}
```

---

### `GET /products/me`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Query:** `status?`, `search?`, `skip?` (0), `take?` (24, max 100)

**Response:** Vendor-scoped product list.

---

### `GET /products/me/stats`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Response:** Product count breakdown by status.

---

### `GET /products/:productId`

**Auth:** `VENDOR_PRODUCTS_WRITE` — must own product

**Response:** Full product with dynamic attributes and variants.

---

### `PATCH /products/:productId`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Body:** `UpdateProductDto` (all optional)
```json
{
  "title?": "string",
  "slug?": "string",
  "description?": "string",
  "status?": "draft" | "hidden" | "archived" | "published",
  "moq?": 1,
  "bulkPricing?": [
    { "minQuantity": 100, "unitPrice": 20.00 }
  ]
}
```

**Note:** Vendors may set `draft`, `hidden`, `archived`, or `published`. Selecting `published` is only allowed when the product is already in `published` status (admin-approved). Initial publication and the `rejected` status can only be set by an administrator.

---

### `DELETE /products/:productId`

**Auth:** `VENDOR_PRODUCTS_WRITE` — soft delete (sets `deletedAt`).

---

### `PUT /products/:productId/categories`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Body:** `SetProductCategoriesDto`
```json
{ "categoryIds?": ["uuid"] }
```

---

## Product Media

### `POST /products/:productId/media`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Body:** `CreateProductMediaDto`
```json
{
  "url": "https://cdn.neoshop.com/...",
  "alt?": "string",
  "sortOrder?": 0,
  "isPrimary?": false,
  "variantId?": "uuid"
}
```

---

### `DELETE /products/:productId/media/:mediaId`

**Auth:** `VENDOR_PRODUCTS_WRITE`

---

## Product Attributes

### `POST /products/:productId/attributes`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Body:** `CreateProductAttributeDto`
```json
{
  "code": "color",
  "label": "Color",
  "sortOrder?": 0,
  "values?": [
    { "value": "Red", "sortOrder?": 0 }
  ]
}
```

---

### `DELETE /products/:productId/attributes/:attributeId`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Note:** Must be unused by variants.

---

### `POST /products/:productId/attributes/:attributeId/values`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Body:** `AddAttributeValuesDto`
```json
{
  "values": [
    { "value": "Red", "sortOrder?": 0 }
  ]
}
```

---

### `DELETE /products/:productId/attributes/:attributeId/values/:valueId`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Note:** Must be unused by variants.

---

## Variants

### `GET /products/:productId/variants`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Response:** List variants for a product owned by the vendor.

---

### `POST /products/:productId/variants`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Body:** `CreateVariantDto`
```json
{
  "attributeValueIds": ["val-uuid-1", "val-uuid-2"],
  "wholesalePrice": 25.00,
  "isActive?": true,
  "weightKg?": 0.5,
  "volumeCbm?": 0.002,
  "imageUrl?": "https://cdn.example.com/black-m.jpg"
}
```

---

### `PATCH /products/:productId/variants/:variantId`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Body:** `UpdateVariantDto` (all optional)
```json
{
  "wholesalePrice?": 25.00,
  "isActive?": true,
  "weightKg?": 0.5,
  "volumeCbm?": 0.002,
  "imageUrl?": "https://cdn.example.com/black-m.jpg"
}
```

---

### `POST /products/:productId/variants/bulk`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Body:** `BulkCreateVariantsDto`
```json
{
  "variants": [
    {
      "attributeValueIds": ["val-uuid-1", "val-uuid-2"],
      "wholesalePrice": 25.00,
      "isActive": true,
      "weightKg": 0.5,
      "volumeCbm": 0.002,
      "imageUrl": "https://cdn.example.com/black-m.jpg"
    },
    {
      "attributeValueIds": ["val-uuid-1", "val-uuid-3"],
      "wholesalePrice": 25.00,
      "isActive": true,
      "weightKg": 0.5,
      "volumeCbm": 0.002,
      "imageUrl": "https://cdn.example.com/black-l.jpg"
    }
  ]
}
```

**Response:** Array of created variants (same shape as `GET /variants`).

---

### `PATCH /products/:productId/variants/bulk`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Body:** `BulkUpdateVariantsDto`
```json
{
  "updates": [
    {
      "variantId": "var-uuid-1",
      "wholesalePrice": 26.00,
      "isActive": false
    },
    {
      "variantId": "var-uuid-2",
      "imageUrl": "https://cdn.example.com/new-image.jpg"
    }
  ]
}
```

**Response:** Array of updated variants.

---

### `POST /products/:productId/variants/bulk-delete`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Body:** `BulkDeleteVariantsDto`
```json
{
  "variantIds": ["var-uuid-1", "var-uuid-2"]
}
```

**Response:** `{ "deletedCount": 2 }`

---

### `DELETE /products/:productId/variants/:variantId`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Note:** Soft-deletes the variant (sets `deletedAt`).

---

## Inventory

Inventory is managed under `/inventory/variants`.

### `GET /inventory/variants/:variantId`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Response:** Stock snapshot for the variant.

---

### `PATCH /inventory/variants/:variantId`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Body:** `SetVariantQuantityDto`
```json
{ "quantity": 100 }
```

---

### `POST /inventory/variants/:variantId/adjust`

**Auth:** `VENDOR_PRODUCTS_WRITE`

**Body:** `AdjustVariantQuantityDto`
```json
{ "delta": -5 }
```

**Note:** Negative values decrement stock; positive values restock.

---

## Vendor Orders

### `GET /orders/vendor`

**Auth:** `vendor` role + `ORDERS_VENDOR_READ`

**Response:** Orders containing items from this vendor's products.

---

### `GET /orders/vendor/stats`

**Auth:** `VENDOR_ANALYTICS_READ`

**Response:** Order count breakdown by status for the vendor.

---

### `GET /orders/vendor/customers`

**Auth:** `VENDOR_CUSTOMERS_READ`

**Response:** Unique customers who ordered from this vendor.

---

### `GET /orders/:orderId`

**Auth:** `customer` | `vendor` | `admin`

**Response:** Order detail with items, timeline, invoices, payments, refunds.

---

### `PATCH /orders/:orderId/status`

**Auth:** `ORDERS_VENDOR_FULFILL`

**Body:** `TransitionOrderDto`
```json
{
  "status": "confirmed" | "shipped" | "delivered" | ...,
  "note?": "string (max 2000)"
}
```

---

### `GET /orders/:orderId/tracking`

**Auth:** `ORDERS_CUSTOMER_READ`

**Response:** Tracking events for the order.

---

## Vendor Reviews

| Method | Path | Auth | Body |
|--------|------|------|------|
| `GET` | `/vendors/me/reviews` | `VENDOR_REVIEWS_READ` | — |
| `POST` | `/vendors/me/reviews/:reviewId/response` | `VENDOR_REVIEWS_RESPOND` | `{ response: string }` |

---

## Disputes (Vendor)

| Method | Path | Auth | Body |
|--------|------|------|------|
| `GET` | `/vendors/me/disputes` | `VENDOR_DISPUTES_READ` | — |
| `GET` | `/vendors/me/disputes/:disputeId` | `VENDOR_DISPUTES_READ` | — |
| `POST` | `/vendors/me/disputes/:disputeId/messages` | `VENDOR_DISPUTES_RESPOND` | `{ body: string, internal?: boolean, replyToId?: uuid }` |

---

## Vendor Analytics

| Method | Path | Auth | Query |
|--------|------|------|-------|
| `GET` | `/vendors/me/analytics/dashboard` | `VENDOR_ANALYTICS_READ` | — |
| `GET` | `/vendors/me/analytics/orders` | `VENDOR_ANALYTICS_READ` | `days?` (default 30) |
| `GET` | `/vendors/me/analytics/products` | `VENDOR_ANALYTICS_READ` | — |

---

## Wallet (Vendor)

Vendors can read their wallet balance and transactions, but deposit and withdrawal requests are currently restricted to the `customer` role:

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/wallet/me` | `WALLET_READ` |
| `GET` | `/wallet/me/transactions` | `WALLET_READ` |

---

## Shared Endpoints Vendors Also Use

### Auth

| Method | Path | Body |
|--------|------|------|
| `POST` | `/auth/register` | `{ email, password, name?, surname?, phone?, role? }` |
| `POST` | `/auth/login` | `{ email, password, deviceId }` |
| `POST` | `/auth/register/phone/initiate` | `{ phone }` |
| `POST` | `/auth/register/phone/verify` | `{ phone, code?, password?, name?, surname?, role? }` |
| `POST` | `/auth/login/phone/initiate` | `{ phone }` |
| `POST` | `/auth/login/phone/verify` | `{ phone, code, deviceId }` |
| `POST` | `/auth/forgot-password` | `{ email }` |
| `POST` | `/auth/reset-password` | `{ token, newPassword }` |
| `POST` | `/auth/resend-verification` | `{ email }` |
| `POST` | `/auth/change-email` | `{ newEmail, password }` |
| `GET` | `/auth/me` | — |
| `POST` | `/auth/sessions` | `{ refreshToken, deviceId, userAgent? }` |
| `POST` | `/auth/refresh` | `{ sessionId, refreshToken }` |
| `POST` | `/auth/logout` | — (needs `Session-Id` header) |
| `POST` | `/auth/logout/all` | — |

### Profile / Settings

| Method | Path | Body |
|--------|------|------|
| `GET` | `/users/me` | — |
| `PATCH` | `/users/me` | `{ name?, surname?, phone?, dateOfBirth?, nationality?, idCardType?, idCardNumber?, avatarUrl? }` |
| `GET` | `/users/me/settings` | — |
| `PATCH` | `/users/me/settings` | `{ orderUpdates?, promoMessages?, emailNewsletter?, pushEnabled? }` |
| `GET` | `/users/me/viewed-products` | — |
| `POST` | `/users/me/viewed-products` | `{ productId }` |

### Catalog (Public)

| Method | Path | Body |
|--------|------|------|
| `GET` | `/catalog/products` | `categoryId?`, `shopSlug?`, `search?`, `skip?`, `take?` |
| `GET` | `/catalog/products/:productId` | — |
| `POST` | `/catalog/products/compare` | `{ productIds: string[] }` (2–4 items) |

### Categories (Public)

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/categories` | Full category tree |

### Public Vendors

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/vendors/public` | Vendor discovery list |
| `GET` | `/vendors/public/:vendorId` | Public vendor profile |

### Shipping

| Method | Path | Body |
|--------|------|------|
| `GET` | `/shipping/methods` | — |
| `POST` | `/shipping/rates` | `{ addressId?, items: [{ variantId, quantity }] }` |

### Notifications

| Method | Path | Body |
|--------|------|------|
| `GET` | `/notifications` | `skip?`, `take?` (max 200), `unreadOnly?` |
| `GET` | `/notifications/unread-count` | — |
| `PATCH` | `/notifications/:notificationId` | `{ read: boolean }` |
| `POST` | `/notifications/read-all` | — |

### Device Tokens

| Method | Path | Body |
|--------|------|------|
| `POST` | `/notifications/devices/register` | `{ token, platform: "android"\|"ios"\|"web", deviceId?, appVersion? }` |
| `POST` | `/notifications/devices/:token/heartbeat` | — |
| `DELETE` | `/notifications/devices/:token` | — |

### Chat

| Method | Path | Body |
|--------|------|------|
| `POST` | `/chat/conversations` | `{ withUserId? \| withVendorId? }` |
| `GET` | `/chat/conversations` | — |
| `GET` | `/chat/conversations/:conversationId` | — |
| `GET` | `/chat/conversations/:conversationId/messages` | `skip?`, `take?` (50, max 100) |
| `POST` | `/chat/conversations/:conversationId/messages` | `{ body }` (1–4000 chars) |
| `DELETE` | `/chat/conversations/:conversationId/messages/:messageId` | — |

### Addresses

| Method | Path | Body |
|--------|------|------|
| `GET` | `/addresses` | — |
| `POST` | `/addresses` | `{ label, street, city, region?, postalCode?, country, phone?, isDefault? }` |
| `PATCH` | `/addresses/:addressId` | Same as create, all optional |
| `DELETE` | `/addresses/:addressId` | — |

### Favorites

| Method | Path | Body |
|--------|------|------|
| `GET` | `/favorites/products` | — |
| `POST` | `/favorites/products` | `{ productId }` |
| `DELETE` | `/favorites/products/:productId` | — |

### Product Q&A

| Method | Path | Body |
|--------|------|------|
| `GET` | `/products/:productId/qa` | — |
| `POST` | `/products/:productId/qa` | `{ question }` (max 1000) |
| `POST` | `/qa/:threadId/answers` | `{ answer }` (max 2000) |

### Referrals

| Method | Path | Body |
|--------|------|------|
| `GET` | `/referrals/me` | — |
| `POST` | `/referrals/redeem` | `{ code }` |

### Reports

| Method | Path | Body |
|--------|------|------|
| `POST` | `/reports` | `{ reportedUserId?\|reportedVendorId?, category, details }` |
| `GET` | `/reports/me` | — |

### Search

| Method | Path | Query |
|--------|------|-------|
| `GET` | `/search/suggestions` | `q` |
| `GET` | `/search/trending` | — |
| `GET` | `/search/history` | — |
| `POST` | `/search/history` | `{ query }` |
| `DELETE` | `/search/history` | — |

### Promotions

| Method | Path | Body |
|--------|------|------|
| `POST` | `/coupons/validate` | `{ code, cartId? }` |
| `GET` | `/promotions/active` | — |

### Exchange Rates

| Method | Path | Query / Body |
|--------|------|--------------|
| `GET` | `/exchange-rates/current` | `from`, `to` |
| `POST` | `/exchange-rates/convert` | `{ amount, fromCurrency, toCurrency }` |

### Storage

| Method | Path | Body / Form |
|--------|------|-------------|
| `POST` | `/storage/upload` | Multipart: `file`, `bucket`, `entityId`, `type`, `subEntityId?` |
| `POST` | `/storage/upload/batch` | Multipart: `files[]`, `bucket`, `entityId`, `types` (JSON), `subEntityId?` |
| `POST` | `/storage/read-urls` | `{ items: [{ bucket, path }] }` |
| `GET` | `/storage/signed-url` | `bucket`, `path` |
| `DELETE` | `/storage` | `{ bucket, path }` |

### Health & Setup

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/health/live` | `{ status: "ok" }` |
| `GET` | `/health/ready` | Health check |
| `GET` | `/health` | Full health check |
| `GET` | `/health/customers` | Platform health |
| `GET` | `/health/vendors` | Platform health |
| `POST` | `/health/beacon` | `{ platform, appVersion, deviceId? }` |
| `GET` | `/setup/status` | `{ setupTokenRequired, canBootstrap }` |
| `POST` | `/setup/bootstrap-admin` | `{ email, password, name? }` |
