# NeoShop — Complete Vendor API Reference

> **Base URL:** `https://api.barkosem.com/api/v1`  
> **Auth:** Supabase JWT Bearer token (`Authorization: Bearer <access_token>`)  
> **Version:** `v1`

Vendors **also** have access to many customer endpoints (`/auth/me`, `/chat`, `/notifications`, `/storage`, etc.) — those are listed in the *Shared Endpoints* section at the bottom of this doc. Some endpoints (cart, checkout, wallet, returns, RFQ, customer reviews, referrals, coupons, addresses, shipping) are restricted to the `customer` role (or require customer-only permissions) and need a separate customer account.

---

## Global Conventions

### Required Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | All vendor endpoints | `Bearer <supabase-access-token>` (JWT, HS256) |
| `X-Request-Id` | Optional | Unique request ID (echoed in response, used for tracing) |
| `X-Correlation-Id` | Optional | Correlation ID for distributed tracing |
| `Idempotency-Key` | Optional | 128-char max; ensures safe retries for state-changing ops |
| `Content-Type` | POST/PATCH/PUT | `application/json` (or `multipart/form-data` for uploads) |
| `User-Agent` | Auto-captured | Used for session tracking |

### Guard Chain (Authenticated Endpoints)

`JwtAuthGuard` → `RolesGuard` → `PermissionsGuard` → `SessionActiveGuard` → `ThrottlerGuard`

- `@Public()` skips JWT authentication
- `@Roles(UserRole.vendor)` restricts to vendor role
- `@RequirePermissions()` restricts by permission
- `@SkipThrottle()` exempts from rate limiting

### Response Format

**Success responses** return the resource payload directly (no wrapper):

```json
{
  "id": "vendor-uuid",
  "status": "APPROVED",
  "...": "..."
}
```

**Error responses** use this envelope:

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
  "path": "/api/v1/...",
  "requestId": "req-uuid",
  "correlationId": "corr-uuid",
  "timestamp": "2024-06-12T10:00:00.000Z"
}
```

- Validation errors return a professional `message`; per-field problems are in `details.fields`.
- Server errors (`statusCode >= 500`) return a generic safe message and omit `details` in production so internal details (database errors, connection strings, etc.) are never exposed.
- Error responses may also include a stable `code` field (e.g. `INSUFFICIENT_BALANCE`) for machine-readable error handling on endpoints that have been migrated to coded errors.

### Data Types

- **Decimal values** (prices, balances): returned as **strings** to preserve precision
- **Dates**: ISO 8601 strings (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- **UUIDs**: Version 4 UUIDs (`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`)
- **Enums**: lowercase snake_case string values

---

## Vendor Profile

### `GET /vendors/me`

Get vendor profile, documents, shops, and recent status history.

**Role:** `vendor`  
**Permission:** `VENDOR_PROFILE_WRITE`

**Response:**
```json
{
  "id": "vendor-uuid",
  "userId": "user-uuid",
  "legalBusinessName": "Acme Corp LLC",
  "tradeName": "Acme Corp",
  "taxId": "TAX123456",
  "businessEmail": "contact@acme.com",
  "businessPhone": "+22670123456",
  "countryCode": "BF",
  "region": "Centre",
  "city": "Ouagadougou",
  "addressLine1": "123 Main Street",
  "postalCode": "01",
  "vendorType": "COMPANY",
  "status": "APPROVED",
  "submittedAt": "2024-06-01T10:00:00Z",
  "onboardingCompletedAt": "2024-05-15T10:00:00Z",
  "rejectionReason": null,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-06-12T10:00:00Z",
  "documents": [
    {
      "id": "doc-uuid",
      "type": "BUSINESS_REGISTRATION",
      "fileUrl": "https://.../doc.pdf",
      "storageBucket": "vendor-documents",
      "storagePath": "vendor-uuid/doc_1234567890.pdf",
      "fileName": "business_reg.pdf",
      "mimeType": "application/pdf",
      "verifiedAt": null,
      "createdAt": "2024-06-01T10:00:00Z"
    }
  ],
  "shops": [
    { "id": "shop-uuid", "slug": "acme-corp", "name": "Acme Corp", "isPublished": true }
  ],
  "statusHistory": [
    { "status": "PENDING_ONBOARDING", "note": "Initial registration", "createdAt": "2024-01-01T00:00:00Z" },
    { "status": "PENDING_VERIFICATION", "note": "Submitted for review", "createdAt": "2024-06-01T10:00:00Z" },
    { "status": "APPROVED", "note": "Verified and approved", "createdAt": "2024-06-05T10:00:00Z" }
  ]
}
```

---

### `POST /vendors/me/register`

Create vendor profile for authenticated seller account.

**Role:** `vendor`  
**Permission:** `VENDOR_PROFILE_WRITE`

**Request Body:**
```json
{
  "vendorType": "COMPANY",                 // required, enum: INDIVIDUAL, COMPANY
  "legalBusinessName": "Acme Corp LLC",  // required, string, 2-200 chars
  "tradeName": "Acme Corp",               // optional, string, max 200
  "taxId": "TAX123456",                   // optional, string, max 64
  "businessEmail": "contact@acme.com",    // optional, email, max 320
  "businessPhone": "+22670123456",        // optional, string, max 32
  "countryCode": "BF"                     // optional, ISO 3166-1 alpha-2, exactly 2 chars
}
```

**Response:** Full `Vendor` object with `status: PENDING_ONBOARDING`

**Error Codes:**
- `400` — Validation error (invalid fields, missing required)
- `409` — Vendor profile already exists

---

### `PATCH /vendors/me/onboarding`

Update onboarding fields while status allows edits (`PENDING_ONBOARDING` or `REJECTED`).

**Role:** `vendor`  
**Permission:** `VENDOR_PROFILE_WRITE`

**Request Body:**
```json
{
  "vendorType": "COMPANY",                 // optional, enum: INDIVIDUAL, COMPANY
  "legalBusinessName": "Acme Corp LLC",  // optional, string, 2-200 chars
  "tradeName": "Acme Corp",               // optional, string, max 200
  "taxId": "TAX123456",                   // optional, string, max 64
  "businessEmail": "contact@acme.com",    // optional, email, max 320
  "businessPhone": "+22670123456",        // optional, string, max 32
  "countryCode": "BF",                    // optional, string, 2 chars
  "region": "Centre",                     // optional, string, max 120
  "city": "Ouagadougou",                  // optional, string, max 120
  "addressLine1": "123 Main Street",      // optional, string, max 240
  "postalCode": "01"                      // optional, string, max 32
}
```

**Response:** Updated `Vendor` profile (same shape as `GET /vendors/me`)

**Error Codes:**
- `400` — Profile locked (status not `PENDING_ONBOARDING` or `REJECTED`)
- `403` — Insufficient permissions

> **Note:** Some fields may be locked after admin approval.

---

### `POST /vendors/me/documents`

Register a verification document metadata + URL.

**Role:** `vendor`  
**Permission:** `VENDOR_PROFILE_WRITE`

**Request Body:**
```json
{
  "type": "BUSINESS_REGISTRATION",        // required, enum: BUSINESS_REGISTRATION, TAX_CERTIFICATE, BANK_PROOF, IDENTITY, OTHER
  "fileUrl": "https://.../doc.pdf",       // required, HTTPS URL, max 2048
  "storageBucket": "vendor-documents",     // optional, string, max 64 — preferred for signed URL refresh
  "storagePath": "vendor-uuid/doc_123.pdf", // optional, string, max 1024
  "fileName": "business_reg.pdf",         // optional, string, max 255
  "mimeType": "application/pdf"           // optional, string, max 128
}
```

**Response:**
```json
{
  "id": "doc-uuid",
  "type": "BUSINESS_REGISTRATION",
  "fileUrl": "https://.../doc.pdf",
  "storageBucket": "vendor-documents",
  "storagePath": "vendor-uuid/doc_123.pdf",
  "fileName": "business_reg.pdf",
  "mimeType": "application/pdf",
  "verifiedAt": null,
  "createdAt": "2024-06-12T10:00:00Z"
}
```

---

### `DELETE /vendors/me/documents/:documentId`

Remove a verification document before approval.

**Role:** `vendor`  
**Permission:** `VENDOR_PROFILE_WRITE`

**Response:** `204 No Content`

---

### `POST /vendors/me/submit-verification`

Submit vendor profile for backend verification / approval workflow.

**Role:** `vendor`  
**Permission:** `VENDOR_PROFILE_WRITE`

**Response:**
```json
{
  "id": "vendor-uuid",
  "status": "PENDING_VERIFICATION",
  "submittedAt": "2024-06-12T10:00:00Z",
  /* ... other vendor fields ... */
}
```

**Business Rules:**
- Must have all required onboarding fields filled
- Must have at least 1 document uploaded

**Error Codes:**
- `400` — Incomplete profile (missing required fields or documents)

---

## Shop Management

### `POST /shops`

Create a shop for the authenticated vendor.

**Role:** `vendor`  
**Permission:** `VENDOR_SHOPS_WRITE`

**Request Body:**
```json
{
  "slug": "acme-corp",                    // required, string, 2-80 chars, regex: ^[a-z0-9]+(?:-[a-z0-9]+)*$
  "name": "Acme Corp",                    // required, string, 2-120 chars
  "description": "Premium apparel supplier" // optional, string, max 4000
}
```

**Response:**
```json
{
  "id": "shop-uuid",
  "vendorId": "vendor-uuid",
  "slug": "acme-corp",
  "name": "Acme Corp",
  "description": "Premium apparel supplier",
  "logoUrl": null,
  "bannerUrl": null,
  "shippingConfig": null,
  "paymentConfig": null,
  "isPublished": false,
  "createdAt": "2024-06-12T10:00:00Z",
  "updatedAt": "2024-06-12T10:00:00Z"
}
```

---

### `GET /shops/me`

List shops owned by the authenticated vendor.

**Role:** `vendor`  
**Permission:** `VENDOR_SHOPS_WRITE`

**Response:**
```json
{
  "items": [
    {
      "id": "shop-uuid",
      "slug": "acme-corp",
      "name": "Acme Corp",
      "description": "Premium apparel supplier",
      "logoUrl": "https://.../logo.webp",
      "bannerUrl": "https://.../banner.webp",
      "isPublished": true,
      "createdAt": "2024-06-12T10:00:00Z"
    }
  ]
}
```

---

### `GET /shops/public/:slug`

Get published shop payload (storefront-safe). Public — no auth required.

**Response:**
```json
{
  "id": "shop-uuid",
  "slug": "acme-corp",
  "name": "Acme Corp",
  "description": "Premium apparel supplier",
  "logoUrl": "https://.../logo.webp",
  "bannerUrl": "https://.../banner.webp",
  "isPublished": true,
  "vendor": {
    "id": "vendor-uuid",
    "tradeName": "Acme Corp",
    "legalBusinessName": "Acme Corp LLC",
    "status": "APPROVED"
  }
}
```

---

### `PATCH /shops/:shopId`

Update shop branding, shipping/payment configs, or publishing state.

**Role:** `vendor`  
**Permission:** `VENDOR_SHOPS_WRITE` — only for shops owned by this vendor

**Request Body:**
```json
{
  "slug": "acme-corp",                    // optional, string, 2-80, same regex
  "name": "Acme Corp",                    // optional, string, 2-120
  "description": "Updated description",   // optional, string, max 4000
  "logoUrl": "https://.../logo.webp",     // optional, HTTPS URL, max 2048
  "bannerUrl": "https://.../banner.webp", // optional, HTTPS URL, max 2048
  "shippingConfig": {                     // optional, JSON object — structured shipping rules
    "zones": [{ "country": "BF", "baseCost": "50.00" }]
  },
  "paymentConfig": {                      // optional, JSON object — payout config
    "method": "bank_transfer",
    "accountNumber": "BF123456789"
  },
  "isPublished": true                     // optional, boolean — blocked unless vendor status is APPROVED
}
```

**Response:** Updated `Shop` object

**Error Codes:**
- `400` — Cannot publish shop (vendor not approved)
- `403` — Not owner of this shop

---

## Products

### `POST /products`

Create a vendor-owned product shell.

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Request Body:**
```json
{
  "title": "Premium Cotton T-Shirt",       // required, string, 2-180
  "slug": "premium-cotton-t-shirt",       // required, string, 2-120, regex: ^[a-z0-9]+(?:-[a-z0-9]+)*$
  "description": "High-quality cotton...",  // optional, string, max 20000
  "currency": "CNY",                      // optional, enum: CNY, XOF — default CNY
  "moq": 100,                             // optional, integer, min 1, default 1
  "bulkPricing": [                        // optional, array of tiers
    { "minQuantity": 100, "unitPrice": 20.00 },
    { "minQuantity": 500, "unitPrice": 18.00 }
  ],
  "categoryIds": ["cat-uuid-1", "cat-uuid-2"] // optional, UUID array, unique
}
```

**Response:**
```json
{
  "id": "prod-uuid",
  "vendorId": "vendor-uuid",
  "title": "Premium Cotton T-Shirt",
  "slug": "premium-cotton-t-shirt",
  "description": "High-quality cotton...",
  "status": "draft",
  "currency": "CNY",
  "moq": 100,
  "bulkPricing": [
    { "minQuantity": 100, "unitPrice": "20.00" },
    { "minQuantity": 500, "unitPrice": "18.00" }
  ],
  "averageRating": "0.00",
  "reviewsCount": 0,
  "categories": [
    { "category": { "id": "cat-uuid-1", "name": "Apparel", "slug": "apparel" } }
  ],
  "attributes": [],
  "media": [],
  "variants": [],
  "createdAt": "2024-06-12T10:00:00Z",
  "updatedAt": "2024-06-12T10:00:00Z"
}
```

---

### `GET /products/me`

List products owned by the authenticated vendor.

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Query Parameters:**
| Param | Type | Default | Constraints |
|-------|------|---------|-------------|
| `status` | enum | — | `draft` \| `pending_review` \| `published` \| `hidden` \| `archived` \| `rejected` |
| `search` | string | — | Max 120 chars, case-insensitive title search |
| `skip` | integer | 0 | Min 0 |
| `take` | integer | 24 | 1-100 |

**Response:**
```json
{
  "items": [
    {
      "id": "prod-uuid",
      "title": "Premium Cotton T-Shirt",
      "slug": "premium-cotton-t-shirt",
      "status": "published",
      "moq": 100,
      "averageRating": "4.50",
      "reviewsCount": 12,
      "primaryImageUrl": "https://.../primary.webp",
      "createdAt": "2024-06-12T10:00:00Z"
    }
  ],
  "total": 50,
  "skip": 0,
  "take": 24
}
```

---

### `GET /products/me/stats`

Product count breakdown by status.

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Response:**
```json
{
  "total": 50,
  "byStatus": {
    "draft": 5,
    "pending_review": 2,
    "published": 40,
    "hidden": 2,
    "archived": 1
  }
}
```

---

### `GET /products/:productId`

Fetch product detail including dynamic attributes and variants.

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE` — must own product

**Response:**
```json
{
  "id": "prod-uuid",
  "vendorId": "vendor-uuid",
  "title": "Premium Cotton T-Shirt",
  "slug": "premium-cotton-t-shirt",
  "description": "High-quality cotton...",
  "status": "published",
  "currency": "CNY",
  "moq": 100,
  "bulkPricing": [
    { "minQuantity": 100, "unitPrice": "20.00" },
    { "minQuantity": 500, "unitPrice": "18.00" }
  ],
  "averageRating": "4.50",
  "reviewsCount": 12,
  "categories": [
    { "category": { "id": "cat-uuid-1", "name": "Apparel", "slug": "apparel" } }
  ],
  "attributes": [
    {
      "id": "attr-uuid",
      "code": "color",
      "label": "Color",
      "sortOrder": 0,
      "values": [
        { "id": "val-uuid-1", "value": "Red", "sortOrder": 0 },
        { "id": "val-uuid-2", "value": "Blue", "sortOrder": 1 }
      ]
    }
  ],
  "media": [
    {
      "id": "media-uuid",
      "url": "https://cdn.neoshop.com/.../main.webp",
      "alt": "Front view",
      "sortOrder": 0,
      "isPrimary": true,
      "variantId": null
    }
  ],
  "variants": [
    {
      "id": "variant-uuid",
      "sku": "SKU-RED-XL-ABC123",
      "wholesalePrice": "25.00",
      "currency": "CNY",
      "isActive": true,
      "imageUrl": "https://.../red-xl.webp",
      "weightKg": "0.5000",
      "volumeCbm": "0.002000",
      "selections": [
        { "attributeValueId": "val-uuid-1", "attributeValue": { "value": "Red" } },
        { "attributeValueId": "val-uuid-4", "attributeValue": { "value": "XL" } }
      ],
      "inventory": { "quantity": 100, "reservedQuantity": 5 }
    }
  ],
  "createdAt": "2024-06-12T10:00:00Z",
  "updatedAt": "2024-06-12T10:00:00Z"
}
```

---

### `PATCH /products/:productId`

Update product descriptors, lifecycle status, or MOQ.

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Request Body:**
```json
{
  "title": "Updated T-Shirt Title",         // optional, string, 2-180
  "slug": "updated-t-shirt",               // optional, string, 2-120
  "description": "Updated description...",   // optional, string, max 20000
  "currency": "CNY",                       // optional, enum: CNY, XOF
  "status": "pending_review",               // optional, enum — vendor may only set: draft, pending_review, hidden
  "moq": 50,                               // optional, integer, min 1
  "bulkPricing": [                         // optional, replaces entire set
    { "minQuantity": 50, "unitPrice": 22.00 }
  ]
}
```

**Response:** Updated `Product` with full includes

**Status Rules:**
- Vendors may set: `draft`, `pending_review`, `hidden`
- Published products can only be moved to `hidden`
- `published`, `rejected`, `archived` can only be set by admin
- Sending current status is allowed as no-op

---

### `DELETE /products/:productId`

Delete a product and all nested catalog rows (soft delete — sets `deletedAt`).

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Response:** `204 No Content`

**Business Rule:** Hard-deletion blocked if product has order history.

---

### `PUT /products/:productId/categories`

Replace category assignments for a product.

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Request Body:**
```json
{
  "categoryIds": ["cat-uuid-1", "cat-uuid-2"] // optional, UUID array, unique — omit or empty to clear
}
```

**Response:** `Product` with categories included (same full shape as `GET /products/:productId`)

---

## Product Media

### `POST /products/:productId/media`

Attach product media via HTTPS URL metadata.

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Request Body:**
```json
{
  "url": "https://cdn.neoshop.com/product-media/vendor-uuid/prod-uuid/main.webp",  // required, HTTPS URL, max 2048 — must be from product-media bucket
  "alt": "Front view",                      // optional, string, max 255
  "sortOrder": 0,                           // optional, integer, min 0
  "isPrimary": true,                       // optional, boolean, default false — cannot be set with variantId
  "variantId": "variant-uuid"              // optional, UUID — associates image with specific variant
}
```

**Response:**
```json
{
  "id": "media-uuid",
  "productId": "prod-uuid",
  "variantId": null,
  "url": "https://cdn.neoshop.com/...",
  "alt": "Front view",
  "sortOrder": 0,
  "isPrimary": true,
  "createdAt": "2024-06-12T10:00:00Z"
}
```

---

### `DELETE /products/:productId/media/:mediaId`

Remove a media asset reference.

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Response:** `204 No Content`

---

## Product Attributes

### `POST /products/:productId/attributes`

Define a dynamic attribute dimension (blocked once variants exist).

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Request Body:**
```json
{
  "code": "color",                          // required, string, 2-64, regex: ^[a-z][a-z0-9_]*$
  "label": "Color",                         // required, string, 1-120
  "sortOrder": 0,                           // optional, integer, min 0
  "values": [                               // optional, array of initial values, min 1
    { "value": "Red", "sortOrder": 0 },
    { "value": "Blue", "sortOrder": 1 },
    { "value": "Green", "sortOrder": 2 }
  ]
}
```

**Response:**
```json
{
  "id": "attr-uuid",
  "productId": "prod-uuid",
  "code": "color",
  "label": "Color",
  "sortOrder": 0,
  "values": [
    { "id": "val-uuid-1", "value": "Red", "sortOrder": 0 },
    { "id": "val-uuid-2", "value": "Blue", "sortOrder": 1 },
    { "id": "val-uuid-3", "value": "Green", "sortOrder": 2 }
  ]
}
```

**Error Codes:**
- `400` — Cannot add attributes after variants exist

---

### `DELETE /products/:productId/attributes/:attributeId`

Remove an attribute dimension (must be unused by variants).

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Response:** `204 No Content`

**Error Codes:**
- `400` — Attribute is used by existing variants

---

### `POST /products/:productId/attributes/:attributeId/values`

Append selectable values for an existing attribute.

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Request Body:**
```json
{
  "values": [                               // required, array, min 1
    { "value": "Yellow", "sortOrder": 3 }
  ]
}
```

**Response:** `ProductAttribute` with full values
```json
{
  "id": "attr-uuid",
  "productId": "prod-uuid",
  "code": "color",
  "label": "Color",
  "sortOrder": 0,
  "values": [
    { "id": "val-uuid-1", "value": "Red", "sortOrder": 0 },
    { "id": "val-uuid-2", "value": "Blue", "sortOrder": 1 },
    { "id": "val-uuid-3", "value": "Yellow", "sortOrder": 3 }
  ]
}
```

---

### `DELETE /products/:productId/attributes/:attributeId/values/:valueId`

Remove a single attribute option (must be unused by variants).

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Response:** `204 No Content`

**Error Codes:**
- `400` — Value is used by existing variants

---

## Variants

### `GET /products/:productId/variants`

List variants for a product owned by the vendor.

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Response:**
```json
{
  "items": [
    {
      "id": "variant-uuid",
      "productId": "prod-uuid",
      "sku": "SKU-RED-XL-ABC123",
      "wholesalePrice": "25.00",
      "isActive": true,
      "imageUrl": "https://.../red-xl.webp",
      "weightKg": "0.5000",
      "volumeCbm": "0.002000",
      "selections": [
        { "attributeValueId": "val-uuid-1", "attributeValue": { "value": "Red" } },
        { "attributeValueId": "val-uuid-4", "attributeValue": { "value": "XL" } }
      ],
      "inventory": { "quantity": 100, "reservedQuantity": 5 },
      "createdAt": "2024-06-12T10:00:00Z"
    }
  ]
}
```

---

### `POST /products/:productId/variants`

Create a dynamically composed variant (SKU auto-generated).

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Request Body:**
```json
{
  "attributeValueIds": ["val-uuid-1", "val-uuid-4"],  // required, UUID array, unique — one per dynamic dimension; empty if product has zero attributes
  "wholesalePrice": 25.00,                 // required, number, min 0
  "currency": "CNY",                       // optional, enum: CNY, XOF — defaults to product currency
  "isActive": true,                        // optional, boolean, default true
  "weightKg": 0.5,                         // optional, number, min 0
  "volumeCbm": 0.002,                      // optional, number, min 0
  "imageUrl": "https://.../red-xl.webp"    // optional, string
}
```

**Response:** `ProductVariant` with selections and inventory
```json
{
  "id": "variant-uuid",
  "productId": "prod-uuid",
  "sku": "SKU-RED-XL-ABC123",
  "wholesalePrice": "25.00",
  "currency": "CNY",
  "isActive": true,
  "imageUrl": "https://.../red-xl.webp",
  "weightKg": "0.5000",
  "volumeCbm": "0.002000",
  "selections": [
    { "attributeValueId": "val-uuid-1", "attributeValue": { "value": "Red" } },
    { "attributeValueId": "val-uuid-4", "attributeValue": { "value": "XL" } }
  ],
  "inventory": { "quantity": 100, "reservedQuantity": 0 },
  "createdAt": "2024-06-12T10:00:00Z",
  "updatedAt": "2024-06-12T10:00:00Z"
}
```

---

### `POST /products/:productId/variants/bulk`

Bulk create variants (up to 50).

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Request Body:**
```json
{
  "variants": [                             // required, array, min 1, max 50
    {
      "attributeValueIds": ["val-uuid-1", "val-uuid-4"],
      "wholesalePrice": 25.00,
      "currency": "CNY",
      "isActive": true,
      "weightKg": 0.5,
      "volumeCbm": 0.002,
      "imageUrl": "https://.../red-xl.webp"
    },
    {
      "attributeValueIds": ["val-uuid-2", "val-uuid-4"],
      "wholesalePrice": 25.00,
      "currency": "CNY",
      "isActive": true,
      "weightKg": 0.5,
      "volumeCbm": 0.002,
      "imageUrl": "https://.../blue-xl.webp"
    }
  ]
}
```

**Response:** `ProductVariant[]` with selections and inventory (same shape as single `POST /products/:productId/variants`)

---

### `PATCH /products/:productId/variants/bulk`

Bulk update variants (up to 50).

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Request Body:**
```json
{
  "updates": [                              // required, array, min 1, max 50
    {
      "variantId": "var-uuid-1",
      "wholesalePrice": 26.00,
      "currency": "CNY",
      "isActive": false
    },
    {
      "variantId": "var-uuid-2",
      "imageUrl": "https://.../new-image.jpg"
    }
  ]
}
```

**Response:** `ProductVariant[]` with selections and inventory (same shape as single variant response)

---

### `POST /products/:productId/variants/bulk-delete`

Bulk soft-delete variants (up to 50).

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Request Body:**
```json
{
  "variantIds": ["var-uuid-1", "var-uuid-2"] // required, UUID array, min 1, max 50
}
```

**Response:**
```json
{
  "deletedCount": 2
}
```

---

### `PATCH /products/:productId/variants/:variantId`

Update pricing, activation state, or dimensions.

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Request Body:**
```json
{
  "wholesalePrice": 26.00,                 // optional, number, min 0
  "currency": "CNY",                       // optional, enum: CNY, XOF
  "isActive": false,                       // optional, boolean
  "weightKg": 0.6,                         // optional, number, min 0
  "volumeCbm": 0.0025,                     // optional, number, min 0
  "imageUrl": "https://.../new-image.jpg"  // optional, string
}
```

**Response:** `ProductVariant` with selections and inventory (same shape as single variant response)

---

### `DELETE /products/:productId/variants/:variantId`

Delete a variant and its inventory row (soft delete).

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Response:** `204 No Content`

---

## Inventory

### `GET /inventory/variants/:variantId`

Read variant stock snapshot.

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Response:**
```json
{
  "variantId": "variant-uuid",
  "quantity": 100,
  "reservedQuantity": 5,
  "createdAt": "2024-06-12T10:00:00Z",
  "updatedAt": "2024-06-12T10:00:00Z"
}
```

---

### `PATCH /inventory/variants/:variantId`

Set absolute on-hand quantity.

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Request Body:**
```json
{
  "quantity": 150                          // required, integer, min 0
}
```

**Response:** Updated `VariantInventory`
```json
{
  "variantId": "variant-uuid",
  "quantity": 150,
  "reservedQuantity": 5,
  "createdAt": "2024-06-12T10:00:00Z",
  "updatedAt": "2024-06-12T10:00:00Z"
}
```

**Side Effect:** Creates `inventoryAdjustment` record with reason `correction`

---

### `POST /inventory/variants/:variantId/adjust`

Apply a stock delta (restock or decrement).

**Role:** `vendor`  
**Permission:** `VENDOR_PRODUCTS_WRITE`

**Request Body:**
```json
{
  "delta": -5                              // required, integer — negative allowed
}
```

**Response:** Updated `VariantInventory`
```json
{
  "variantId": "variant-uuid",
  "quantity": 95,
  "reservedQuantity": 5,
  "createdAt": "2024-06-12T10:00:00Z",
  "updatedAt": "2024-06-12T10:00:00Z"
}
```

**Side Effect:** Creates `inventoryAdjustment` with reason `restock` (positive) or `adjustment` (negative)

**Business Rule:** Rejected if resulting quantity < 0

**Error Codes:**
- `400` — Resulting quantity would be negative

---

## Vendor Orders

### `GET /orders/vendor`

List orders for the authenticated vendor.

**Role:** `vendor`  
**Permission:** `ORDERS_VENDOR_READ`

**Response:**
```json
{
  "items": [
    {
      "id": "order-uuid",
      "checkoutGroupId": "group-uuid",
      "customerUserId": "user-uuid",
      "customer": {
        "id": "user-uuid",
        "email": "user@example.com"
      },
      "status": "paid",
      "currency": "XOF",
      "subtotal": "250.00",
      "taxTotal": "0.00",
      "shippingTotal": "0.00",
      "grandTotal": "250.00",
      "placedAt": "2024-06-12T10:00:00Z",
      "items": [
        {
          "id": "item-uuid",
          "variantId": "variant-uuid",
          "quantity": 10,
          "unitPrice": "25.00",
          "lineTotal": "250.00",
          "skuSnapshot": "SKU-A1B2C3",
          "titleSnapshot": "T-Shirt",
          "variantImageUrl": "https://.../red-variant.webp"
        }
      ]
    }
  ]
}
```

---

### `GET /orders/vendor/stats`

Order count breakdown by status.

**Role:** `vendor`  
**Permission:** `VENDOR_ANALYTICS_READ`

**Response:**
```json
{
  "total": 450,
  "byStatus": {
    "pending": 5,
    "paid": 8,
    "processing": 12,
    "shipped": 15,
    "delivered": 420,
    "disputed": 2,
    "refunded": 3,
    "cancelled": 10
  }
}
```

---

### `GET /orders/vendor/customers`

List unique customers who ordered from this vendor.

**Role:** `vendor`  
**Permission:** `VENDOR_CUSTOMERS_READ`

**Response:**
```json
{
  "items": [
    {
      "userId": "user-uuid",
      "name": "John",
      "surname": "Doe",
      "email": "user@example.com",
      "phone": "+22670123456",
      "orderCount": 5,
      "totalSpent": "1234.56",
      "products": [
        {
          "productId": "prod-uuid",
          "title": "T-Shirt",
          "totalQuantity": 10,
          "totalSpent": "500.00"
        }
      ]
    }
  ]
}
```

> **Notes:**
> - `orderCount` — total orders placed by this customer with the vendor
> - `totalSpent` — sum of all order grand-totals
> - `products` — distinct products purchased, sorted by highest spend first
> - Soft-deleted users and deleted orders are excluded

---

### `GET /orders/:orderId`

Get order detail with items, timeline, invoices, payments, refunds.

**Roles:** `customer` (owner), `vendor` (seller), `admin`

**Response:**
```json
{
  "id": "order-uuid",
  "checkoutGroupId": "group-uuid",
  "customerUserId": "user-uuid",
  "customer": { "id": "user-uuid", "email": "user@example.com" },
  "vendorId": "vendor-uuid",
  "vendor": { "id": "vendor-uuid", "tradeName": "Acme Corp", "legalBusinessName": "Acme Corp LLC" },
  "status": "paid",
  "currency": "XOF",
  "vendorCurrency": "CNY",
  "subtotal": "250.00",
  "taxTotal": "0.00",
  "shippingTotal": "0.00",
  "grandTotal": "250.00",
  "couponCode": null,
  "placedAt": "2024-06-12T10:00:00Z",
  "updatedAt": "2024-06-12T10:00:00Z",
  "items": [
    {
      "id": "item-uuid",
      "variantId": "variant-uuid",
      "quantity": 10,
      "unitPrice": "25.00",
      "lineTotal": "250.00",
      "skuSnapshot": "SKU-A1B2C3",
      "titleSnapshot": "T-Shirt",
      "variantImageUrl": "https://.../red-variant.webp",
      "variant": {
        "id": "variant-uuid",
        "sku": "SKU-A1B2C3",
        "imageUrl": "https://.../red-variant.webp",
        "weightKg": "0.5000",
        "volumeCbm": "0.002000",
        "currency": "CNY"
      }
    }
  ],
  "statusHistory": [
    { "id": "hist-uuid", "status": "pending", "note": null, "actorUserId": null, "createdAt": "2024-06-12T09:00:00Z" },
    { "id": "hist-uuid-2", "status": "paid", "note": "Payment captured", "actorUserId": "user-uuid", "createdAt": "2024-06-12T10:00:00Z" }
  ],
  "invoices": [],
  "payments": [],
  "refunds": []
}
```

---

### `PATCH /orders/:orderId/status`

Fulfillment status change (business rules enforced).

**Roles:** `vendor`, `admin`  
**Permission:** `ORDERS_VENDOR_FULFILL`

**Request Body:**
```json
{
  "status": "processing",                 // required, enum: pending, paid, processing, shipped, delivered, disputed, refunded, cancelled
  "note": "Order confirmed, preparing shipment" // optional, string, max 2000
}
```

**Vendor Allowed Transitions:**
| From | To |
|------|-----|
| `paid` | `processing` |
| `processing` | `shipped` |
| `shipped` | `delivered` |

**Response:** Updated `Order` with full detail include (same shape as `GET /orders/:orderId`)

**Error Codes:**
- `400` — Invalid status transition
- `403` — Not order vendor

---

### `GET /orders/:orderId/tracking`

Get tracking events for an order.

**Roles:** `customer`, `vendor`, `admin`  
**Permission:** `ORDERS_CUSTOMER_READ`

**Response:**
```json
{
  "carrier": "DHL",
  "trackingNumber": "1234567890",
  "events": [
    {
      "id": "event-uuid",
      "status": "shipped",
      "location": "Ouagadougou",
      "note": "Package left facility",
      "createdAt": "2024-06-12T10:00:00Z"
    }
  ]
}
```

> ⚠️ **Vendor caveat:** Although the route allows the `vendor` role, it requires the `ORDERS_CUSTOMER_READ` permission, which is **not** granted to vendors in the current permission registry. Vendors should rely on `GET /orders/:orderId` for tracking/timeline information instead.

---

## Vendor Reviews

### `GET /vendors/me/reviews`

List reviews on products owned by this vendor.

**Role:** `vendor`  
**Permission:** `VENDOR_REVIEWS_READ`

**Response:**
```json
{
  "items": [
    {
      "id": "review-uuid",
      "productId": "prod-uuid",
      "productTitle": "T-Shirt",
      "customerName": "John D.",
      "rating": 5,
      "title": "Great quality!",
      "body": "The fabric is excellent.",
      "mediaUrls": ["https://.../photo1.jpg"],
      "helpfulCount": 3,
      "isVerifiedPurchase": true,
      "vendorResponse": "Thank you for your feedback!",
      "vendorRespondedAt": "2024-06-13T10:00:00Z",
      "createdAt": "2024-06-12T10:00:00Z"
    }
  ]
}
```

---

### `POST /vendors/me/reviews/:reviewId/response`

Respond to a review as the vendor.

**Role:** `vendor`  
**Permission:** `VENDOR_REVIEWS_RESPOND`

**Request Body:**
```json
{
  "response": "Thank you for your feedback!" // required, string
}
```

**Response:** Updated `Review` with `vendorResponse` and `vendorRespondedAt`
```json
{
  "id": "review-uuid",
  "productId": "prod-uuid",
  "customerId": "user-uuid",
  "orderItemId": "order-item-uuid",
  "rating": 5,
  "title": "Great quality!",
  "comment": "The fabric is excellent.",
  "mediaUrls": ["https://.../photo1.jpg"],
  "helpfulCount": 3,
  "vendorResponse": "Thank you for your feedback!",
  "vendorRespondedAt": "2024-06-13T10:00:00Z",
  "createdAt": "2024-06-12T10:00:00Z",
  "updatedAt": "2024-06-13T10:00:00Z",
  "deletedAt": null
}
```

---

## Disputes (Vendor)

### `GET /vendors/me/disputes`

List disputes for orders placed with this vendor.

**Role:** `vendor`  
**Permission:** `VENDOR_DISPUTES_READ`

**Response:**
```json
{
  "items": [
    {
      "id": "dispute-uuid",
      "orderId": "order-uuid",
      "customerEmail": "user@example.com",
      "amountClaimed": "250.00",
      "currency": "XOF",
      "status": "open",
      "reasonCategory": "order_issue",
      "escalationTier": 0,
      "openedAt": "2024-06-12T10:00:00Z",
      "messageCount": 5
    }
  ]
}
```

---

### `GET /vendors/me/disputes/:disputeId`

Get dispute detail (vendor view).

**Role:** `vendor`  
**Permission:** `VENDOR_DISPUTES_READ`

**Response:**
```json
{
  "id": "dispute-uuid",
  "orderId": "order-uuid",
  "customerEmail": "user@example.com",
  "amountClaimed": "250.00",
  "currency": "XOF",
  "status": "open",
  "reasonCategory": "order_issue",
  "escalationTier": 0,
  "openedAt": "2024-06-12T10:00:00Z",
  "resolvedAt": null,
  "messages": [
    {
      "id": "msg-uuid",
      "body": "I received the wrong item.",
      "internal": false,
      "author": {
        "id": "user-uuid",
        "name": "John",
        "role": "customer"
      },
      "createdAt": "2024-06-12T10:00:00Z"
    }
  ]
}
```

---

### `POST /vendors/me/disputes/:disputeId/messages`

Post a message in a dispute.

**Role:** `vendor`  
**Permission:** `VENDOR_DISPUTES_RESPOND`

**Request Body:**
```json
{
  "body": "We apologize for the inconvenience...",  // required, string, 1-8000 chars
  "internal": false,                                   // optional, boolean — internal notes visible only to admin/vendor
  "replyToId": "msg-uuid"                              // optional, UUID — reply to specific message
}
```

**Response:** Dispute message record
```json
{
  "id": "msg-uuid",
  "disputeId": "dispute-uuid",
  "authorUserId": "user-uuid",
  "body": "We apologize for the inconvenience...",
  "internal": false,
  "replyToId": null,
  "createdAt": "2024-06-12T10:00:00Z"
}
```

---

## Vendor Analytics

All analytics endpoints require `vendor` role + `VENDOR_ANALYTICS_READ` permission.

### `GET /vendors/me/analytics/dashboard`

Returns KPIs, status breakdown, top products, geographic sales, retention, and conversion metrics.

**Response:**
```json
{
  "totalRevenue": "125000.0000",
  "totalOrders": 450,
  "totalCustomers": 120,
  "averageOrderValue": "277.78",
  "pendingOrders": 5,
  "processingOrders": 8,
  "shippedOrders": 12,
  "deliveredOrders": 420,
  "disputedOrders": 2,
  "topProducts": [
    {
      "variantId": "variant-uuid",
      "productTitle": "Premium Cotton T-Shirt",
      "quantitySold": 100,
      "revenue": "5000.0000"
    }
  ],
  "period": "30d",
  "geographic": [
    {
      "countryCode": "BF",
      "name": "Burkina Faso",
      "revenue": "12500.0000",
      "orderCount": 45
    }
  ],
  "retentionSeries": [
    {
      "period": "2024-01",
      "label": "Jan",
      "returningCustomers": 12,
      "totalCustomers": 45,
      "rate": 0.27
    }
  ],
  "conversionRate": 3.5,
  "conversionTrend": [
    { "label": "Jun 1", "value": 3.2 },
    { "label": "Jun 2", "value": 3.5 }
  ]
}
```

> **Notes:**
> - `geographic` grouped by `Order.shippingAddress.country`. Missing addresses appear as `UNKNOWN`.
> - `retentionSeries` counts a customer as "returning" in a month if they ordered in any earlier month.
> - `conversionRate` / `conversionTrend` are a **proxy** based on logged-in users who viewed vendor products vs. those who placed orders.

---

### `GET /vendors/me/analytics/orders`

Daily order count and revenue.

**Query Parameters:**
| Param | Type | Default | Constraints |
|-------|------|---------|-------------|
| `days` | integer | 30 | Min 1 |

**Response:**
```json
{
  "items": [
    { "date": "2024-06-01", "orders": 5, "revenue": "1200.00" },
    { "date": "2024-06-02", "orders": 8, "revenue": "2100.00" }
  ]
}
```

---

### `GET /vendors/me/analytics/products`

Product performance summary (up to 100 products).

**Response:**
```json
{
  "items": [
    {
      "id": "prod-uuid",
      "title": "Premium Cotton T-Shirt",
      "slug": "premium-cotton-t-shirt",
      "status": "published",
      "imageUrl": "https://.../primary.webp",
      "variantCount": 3,
      "averageRating": "4.50",
      "reviewsCount": 12,
      "totalSold": 45,
      "totalRevenue": "1200.00"
    }
  ]
}
```

---

### `GET /vendors/me/analytics/inventory`

Daily units sold vs. restocked.

**Query Parameters:**
| Param | Type | Default | Constraints |
|-------|------|---------|-------------|
| `days` | integer | 30 | Min 1 |

**Response:**
```json
{
  "items": [
    {
      "date": "2024-06-01",
      "label": "Jun 1",
      "unitsSold": 45,
      "restocked": 60
    }
  ]
}
```

> **Notes:**
> - `unitsSold` derived from `OrderItem` quantities for orders placed in the window.
> - `restocked` derived from `InventoryAdjustment` records with positive quantity and reason `restock` or `return`.
> - Historical restocked data only available from when the model was introduced.

---

## Wallet (Vendor)

> ⚠️ **Currently not vendor-usable.** Wallet controllers (`/wallet/*`) require `WALLET_READ` / `WALLET_WRITE` permissions. The current `vendor` role permission registry does **not** include these permissions, so all wallet endpoints will return `403 Forbidden` for vendor accounts. Wallet functionality is restricted to `customer` and admin roles at this time.

---

## Shared Endpoints Vendors Also Use

> **Permission note:** The endpoints below are accessible to a vendor account because the route allows the `vendor` role and the vendor permission registry includes the required permission. Endpoints that require permissions **not** granted to vendors (e.g. `ADDRESSES_MANAGE`, `SHIPPING_READ`, `WALLET_READ`, `REFERRALS_READ`, `COUPONS_VALIDATE`, `RECENTLY_VIEWED_MANAGE`) are excluded from this list. If your deployment needs vendors to use those endpoints, update `ROLE_PERMISSIONS.vendor` in `backend/src/modules/permissions/permission.registry.ts`.

### Auth

| Method | Path | Body | Rate Limit |
|--------|------|------|------------|
| `POST` | `/auth/register` | `{ email, password, name?, surname?, phone?, role? }` | 5/60s |
| `POST` | `/auth/login` | `{ email, password, deviceId }` | 10/60s |
| `POST` | `/auth/register/phone/initiate` | `{ phone }` | 3/60s |
| `POST` | `/auth/register/phone` | `{ phone, password, name?, surname?, role? }` | 5/60s |
| `POST` | `/auth/register/phone/verify` | `{ phone, code?, password?, name?, surname?, role? }` | 5/60s |
| `POST` | `/auth/login/phone/initiate` | `{ phone }` | 3/60s |
| `POST` | `/auth/login/phone` | `{ phone, password, deviceId }` | 10/60s |
| `POST` | `/auth/login/phone/verify` | `{ phone, code, deviceId }` | 5/60s |
| `POST` | `/auth/forgot-password` | `{ email }` | 3/60s |
| `POST` | `/auth/reset-password` | `{ token, newPassword }` | 5/60s |
| `POST` | `/auth/resend-verification` | `{ email }` | 3/60s |
| `POST` | `/auth/reactivate` | `{ email, password, deviceId? }` | 5/60s |
| `POST` | `/auth/change-email` | `{ newEmail, password }` | 3/60s |
| `GET` | `/auth/me` | — | — |
| `POST` | `/auth/sessions` | `{ refreshToken, deviceId, userAgent? }` | — |
| `POST` | `/auth/refresh` | `{ sessionId, refreshToken }` | 20/60s |
| `POST` | `/auth/logout` | — (needs `X-Session-Id` header) | — |
| `POST` | `/auth/logout/all` | — | — |

### Profile / Settings

| Method | Path | Body |
|--------|------|------|
| `GET` | `/users/me` | — |
| `PATCH` | `/users/me` | `{ name?, surname?, phone?, dateOfBirth?, nationality?, idCardType?, idCardNumber?, avatarUrl? }` |
| `GET` | `/users/me/settings` | — |
| `PATCH` | `/users/me/settings` | `{ orderUpdates?, promoMessages?, emailNewsletter?, pushEnabled?, preferredLanguage? }` |
| `POST` | `/users/me/suspend` | — |
| `POST` | `/users/me/request-deletion` | `{ password }` |

### Catalog (Public)

| Method | Path | Query / Body |
|--------|------|--------------|
| `GET` | `/catalog/products` | `categoryId?`, `shopSlug?`, `search?`, `currency?` (XOF\|CNY), `skip?`, `take?` (max 48) |
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

> ⚠️ **Not vendor-usable by default.** Requires `SHIPPING_READ`, which is not in the vendor permission registry.

| Method | Path | Body |
|--------|------|------|
| `GET` | `/shipping/methods` | — |
| `POST` | `/shipping/rates` | `{ addressId?, items: [{ variantId, quantity }] }` |

### Notifications

| Method | Path | Query / Body |
|--------|------|--------------|
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
| `GET` | `/chat/support-contact` | — |
| `POST` | `/chat/conversations` | `{ withUserId? \| withVendorId? }` |

> **Support chat:** `GET /chat/support-contact` is public and returns the active platform support user (oldest `super_admin`, falling back to oldest `admin`). Vendors can use the returned `id` as `withUserId` in `POST /chat/conversations` to reach platform administrators.
| `GET` | `/chat/conversations` | — |
| `GET` | `/chat/conversations/:conversationId` | — |
| `GET` | `/chat/conversations/:conversationId/messages` | `skip?`, `take?` (50, max 100) |
| `POST` | `/chat/conversations/:conversationId/messages` | `{ body }` (1–4000 chars) |
| `POST` | `/chat/conversations/:conversationId/attachments` | Multipart: `file` (image max 1 MB, PDF max 5 MB) |
| `DELETE` | `/chat/conversations/:conversationId/messages/:messageId` | — |

### Addresses

> ⚠️ **Not vendor-usable by default.** Requires `ADDRESSES_MANAGE`, which is not in the vendor permission registry.

| Method | Path | Body |
|--------|------|------|
| `GET` | `/addresses` | — |
| `POST` | `/addresses` | `{ label, fullName, streetLine1, streetLine2?, city, region?, postalCode?, country, phone?, isDefault? }` |
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
| `GET` | `/promotions/active` | — |

> `/coupons/validate` requires `COUPONS_VALIDATE` and is **not** vendor-usable by default.

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
| `POST` | `/storage/read-urls` | `{ items: [{ bucket, path }] }` (max 50) |
| `GET` | `/storage/signed-url` | `bucket`, `path` |
| `DELETE` | `/storage` | `{ bucket, path }` |

### Health & Setup

| Method | Path | Response | Rate Limit |
|--------|------|----------|------------|
| `GET` | `/health/live` | `{ status: "ok" }` | Skipped |
| `GET` | `/health/ready` | Health check | 60/60s |
| `GET` | `/health` | Full health check | 60/60s |
| `GET` | `/health/customers` | Platform health | 30/60s |
| `GET` | `/health/vendors` | Platform health | 30/60s |
| `POST` | `/health/beacon` | `{ received: true }` | 60/60s |
| `GET` | `/setup/status` | `{ status, message }` | Default |
| `POST` | `/setup/bootstrap-admin` | `{ supabaseUserId, email }` | — |

---

## Vendor Permission Registry

| Permission | Key | Description |
|------------|-----|-------------|
| `VENDOR_PROFILE_WRITE` | `vendor.profile.write` | Create/update vendor profile, documents, submit verification |
| `VENDOR_SHOPS_WRITE` | `vendor.shops.write` | Create/update shops |
| `VENDOR_PRODUCTS_WRITE` | `vendor.products.write` | CRUD products, attributes, variants, media |
| `CATALOG_MANAGE` | `catalog.manage` | Catalog operations |
| `ORDERS_VENDOR_READ` | `orders.vendor.read` | View vendor orders |
| `ORDERS_VENDOR_FULFILL` | `orders.vendor.fulfill` | Update order status (fulfillment) |
| `VENDOR_ANALYTICS_READ` | `vendor.analytics.read` | View analytics dashboard |
| `VENDOR_CUSTOMERS_READ` | `vendor.customers.read` | View customer list and spend |
| `VENDOR_REVIEWS_READ` | `vendor.reviews.read` | View product reviews |
| `VENDOR_REVIEWS_RESPOND` | `vendor.reviews.respond` | Respond to reviews |
| `VENDOR_DISPUTES_READ` | `vendor.disputes.read` | View disputes |
| `VENDOR_DISPUTES_RESPOND` | `vendor.disputes.respond` | Respond to disputes |
| `PROFILE_READ` | `profile.read` | View own profile |
| `PROFILE_WRITE` | `profile.write` | Edit own profile |
| `SETTINGS_MANAGE` | `settings.manage` | Notification/settings preferences |
| `CHAT_PARTICIPATE` | `chat.participate` | Messaging |
| `NOTIFICATIONS_READ` | `notifications.read` | In-app notifications |
| `STORAGE_MANAGE` | `storage.manage` | Upload/download/delete files |
| `REPORTS_SUBMIT` | `reports.submit` | Submit reports |
| `FAVORITES_MANAGE` | `favorites.manage` | Save/unsave products |

---

## Rate Limiting Summary

| Endpoint Group | Limit | TTL | Scope |
|----------------|-------|-----|-------|
| Auth register | 5 | 60s | IP |
| Auth login | 10 | 60s | IP |
| Auth phone initiate | 3 | 60s | IP |
| Auth phone verify | 5 | 60s | IP |
| Auth forgot-password | 3 | 60s | IP |
| Auth reset-password | 5 | 60s | IP |
| Auth resend-verification | 3 | 60s | IP |
| Auth reactivate | 5 | 60s | IP |
| Auth change-email | 3 | 60s | IP |
| Auth refresh | 20 | 60s | IP |
| Health ready / check | 60 | 60s | IP |
| Health customers / vendors | 30 | 60s | IP |
| Health beacon | 60 | 60s | IP |

> **Note:** Most vendor-specific endpoints (products, variants, inventory, shops, analytics, reviews, disputes) use the global ThrottlerGuard default (typically 100 req / 60s). No custom `@Throttle` decorators are applied to these controllers.

---

## WebSocket / Real-Time Events

Connect to `wss://api.barkosem.com/realtime` (Socket.IO).

**Auth:** Pass the JWT access token **and** the active session id in the `auth` handshake:
```javascript
const socket = io('wss://api.barkosem.com/realtime', {
  auth: {
    token: '<access_token>',
    sessionId: '<session_id>', // from POST /auth/sessions
  }
});
```

Connections are rate-limited per IP (20 attempts / 60 s) and per user (5 attempts / 60 s). The gateway also verifies that the session has not been revoked or expired.

**Events:**

| Event | Direction | Payload |
|-------|-----------|---------|
| `neoshop.order.updated` | Server → Client | `{ orderId, vendorId, customerUserId, from, to, note }` |
| `neoshop.vendors.updated` | Server → Client | `{ vendorId, status, ... }` — emitted when your vendor lifecycle status changes |
| `neoshop.chat.message` | Server → Client | `{ conversationId, messageId, senderUserId, body, createdAt }` |
| `neoshop.notification.created` | Server → Client | `{ id, type, title, body, data }` |

**Connection lifecycle:**
1. Client connects with JWT token
2. Server verifies token and checks user suspension status
3. Client joins rooms: `user:<userId>`, `order:<orderId>` (for active orders)
4. Server disconnects client if user is suspended

---

## Error Codes Reference

| Status | Code | Meaning |
|--------|------|---------|
| `400` | `Bad Request` | Validation error, invalid input, business rule violation |
| `401` | `Unauthorized` | Missing/invalid JWT, incorrect PIN, invalid credentials |
| `403` | `Forbidden` | Insufficient permissions, not resource owner |
| `404` | `Not Found` | Resource doesn't exist |
| `409` | `Conflict` | Resource already exists, state conflict |
| `429` | `Too Many Requests` | Rate limit exceeded |
| `500` | `Internal Server Error` | Unexpected server error |
| `503` | `Service Unavailable` | External service down (Supabase, Redis, etc.) |
