# Vendor Product CRUD & Image Integration Guide

This document explains how the vendor frontend should create, read, update, delete products and manage product images.

---

## Overview

- Products are owned by the authenticated vendor.
- Images are uploaded to the public Supabase bucket `product-media`, then attached to the product via URL.
- The product list now includes `primaryImageUrl` for thumbnail display.
- Deleting a product performs a **true hard delete** (DB rows + storage files are removed).

---

## 1. Create a Product

**Endpoint:**
```http
POST /api/v1/products
```

**Body:**
```json
{
  "title": "My Product",
  "slug": "my-product",
  "description": "Product description",
  "categoryIds": ["category-uuid-1", "category-uuid-2"],
  "moq": 10
}
```

**Response:** Full product object with empty `media`, `variants`, `attributes`.

---

## 2. List Vendor Products

**Endpoint:**
```http
GET /api/v1/products/me?skip=0&take=24&status=&search=
```

**Response:**
```json
{
  "items": [
    {
      "id": "prod-uuid",
      "title": "My Product",
      "status": "DRAFT",
      "slug": "my-product",
      "moq": 10,
      "_count": {
        "media": 3,
        "variants": 2
      },
      "primaryImageUrl": "https://...supabase.co/storage/v1/object/public/product-media/..."
    }
  ],
  "total": 42,
  "skip": 0,
  "take": 24
}
```

**Frontend usage:**
- Render `primaryImageUrl` directly in `<img>` tags for the product grid/thumbnails.
- No extra storage calls needed — the URL is a public Supabase URL.

---

## 3. Get Product Detail

**Endpoint:**
```http
GET /api/v1/products/:productId
```

**Response includes full `media` array:**
```json
{
  "id": "prod-uuid",
  "title": "My Product",
  "media": [
    {
      "id": "media-uuid",
      "url": "https://...supabase.co/storage/v1/object/public/product-media/...",
      "alt": "Front view",
      "sortOrder": 0,
      "isPrimary": true
    }
  ],
  "variants": [...],
  "attributes": [...],
  "categories": [...]
}
```

**Frontend usage:**
- Use `media[].url` directly in image galleries.
- Use `isPrimary` to highlight the main image.

---

## 4. Update a Product

**Endpoint:**
```http
PATCH /api/v1/products/:productId
```

**Body (all fields optional):**
```json
{
  "title": "Updated Title",
  "slug": "updated-slug",
  "description": "Updated description",
  "status": "hidden",
  "moq": 5
}
```

**Important vendor rules:**
- Vendors **cannot** set status to `published`, `rejected`, or `archived` — only admins can.
- A `published` product can only be moved to `hidden` by the vendor.
- Slug must be unique per vendor.

---

## 5. Delete a Product

**Endpoint:**
```http
DELETE /api/v1/products/:productId
```

**Behavior:**
- **True hard delete** — product, variants, attributes, media rows, reviews, etc. are all permanently removed from PostgreSQL.
- Image files in Supabase Storage are also deleted.
- **Blocked if the product has orders** — returns `400 Bad Request`:
  > *"Cannot delete a product that has been ordered. Archive or hide it instead."*

---

## 6. Upload & Attach Images

### Step 6a — Upload file to storage

**Endpoint:**
```http
POST /api/v1/storage/upload
Content-Type: multipart/form-data
```

**Fields:**
| Field | Value |
|-------|-------|
| `file` | Binary image file (jpg, png, webp) |
| `bucket` | `product-media` |
| `entityId` | Product UUID |
| `type` | `main` (or any label you use) |

**Response:**
```json
{
  "bucket": "product-media",
  "path": "vendor-id/product-id/main_1710000000000.webp",
  "publicUrl": "https://yourproject.supabase.co/storage/v1/object/public/product-media/vendor-id/product-id/main_1710000000000.webp"
}
```

### Step 6b — Attach to product

**Endpoint:**
```http
POST /api/v1/products/:productId/media
Content-Type: application/json
```

**Body:**
```json
{
  "url": "https://yourproject.supabase.co/storage/v1/object/public/product-media/...",
  "alt": "Front view",
  "isPrimary": true,
  "sortOrder": 0
}
```

**Notes:**
- `url` must be a valid HTTPS URL.
- Only one image can be `isPrimary: true` per product. Setting a new primary automatically unsets the previous one.
- You can attach multiple images by calling this endpoint repeatedly.

---

## 7. Remove an Image

**Endpoint:**
```http
DELETE /api/v1/products/:productId/media/:mediaId
```

**Behavior:**
- Removes the `ProductMedia` row (metadata).
- **Does NOT delete the file from Supabase Storage.** (The file will be cleaned up only when the entire product is deleted.)
- If you need to also delete the storage file immediately, call the storage delete endpoint separately:
  ```http
  DELETE /api/v1/storage
  Content-Type: application/json
  { "bucket": "product-media", "path": "vendor-id/product-id/filename.webp" }
  ```

---

## Summary for Frontend Team

| Operation | Endpoint | Images in Response? |
|-----------|----------|---------------------|
| Create | `POST /products` | No |
| List | `GET /products/me` | Yes (`primaryImageUrl`) |
| Detail | `GET /products/:id` | Yes (`media[]`) |
| Update | `PATCH /products/:id` | Yes (full detail returned) |
| Delete | `DELETE /products/:id` | N/A |
| Attach image | `POST /products/:id/media` | Returns the media row |
| Remove image | `DELETE /products/:id/media/:mediaId` | N/A |

**Image URLs are public** — render them directly in `<img>` tags. No signed URL requests needed.
