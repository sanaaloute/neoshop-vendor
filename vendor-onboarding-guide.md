# Vendor Onboarding Guide

This document describes the complete vendor onboarding flow for the NeoShop platform, including the two vendor types, the step-by-step API workflow, and the admin review process.

---

## Table of Contents

1. [Overview](#overview)
2. [Vendor Types](#vendor-types)
3. [Vendor Onboarding Flow](#vendor-onboarding-flow)
4. [Admin Review & Approval Flow](#admin-review--approval-flow)
5. [Field Requirements Matrix](#field-requirements-matrix)
6. [Status Lifecycle](#status-lifecycle)
7. [API Reference](#api-reference)
   - [Vendor Endpoints](#vendor-endpoints)
   - [Admin Endpoints](#admin-endpoints)

---

## Overview

NeoShop supports two vendor onboarding paths to accommodate both small individual sellers and established businesses:

| Type | Target User | Complexity |
|------|------------|------------|
| **Individual** | Solo sellers, artisans, freelancers | Minimal — identity + contact only |
| **Company** | Registered businesses, LLCs, corporations | Standard — business info + verification docs |

Both paths converge into the same admin review queue. The key difference is the **required information** and the **type of documents** expected.

> **Important:** Identity verification is the most important gate. Every vendor must upload at least one verification document before submitting for review.

---

## Vendor Types

### `INDIVIDUAL`

For sellers who do not have a registered business entity. Think of freelancers, artisans, or people selling personal goods.

- **No tax ID required**
- **No business registration documents required**
- Must provide identity document (passport, national ID, driver's licence)
- Can use a personal name or trade name as the shop name

### `COMPANY`

For registered businesses with legal entity status.

- Tax ID is optional during onboarding (can be collected later before payouts)
- Business registration or tax certificate is recommended
- Postal code is required (unlike individuals)

---

## Vendor Onboarding Flow

### Step 1: Register as a Vendor

The user must already have an account with the `vendor` role. They create their vendor profile by choosing a type.

```http
POST /api/v1/vendors/me/register
```

**Request body:**

```json
{
  "vendorType": "INDIVIDUAL",
  "legalBusinessName": "Amina's Handmade Crafts",
  "tradeName": "Amina Crafts",
  "businessEmail": "amina@example.com",
  "businessPhone": "+22501234567",
  "countryCode": "CI"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vendorType` | `INDIVIDUAL` \| `COMPANY` | ✅ Yes | Determines the onboarding path |
| `legalBusinessName` | string | ✅ Yes | Display / shop name. For individuals, can be a personal name |
| `tradeName` | string | ❌ No | Optional trading name |
| `taxId` | string | ❌ No | Optional for both types. Can be added later |
| `businessEmail` | string | ❌ No | Business contact email |
| `businessPhone` | string | ❌ No | Business contact phone |
| `countryCode` | string (ISO-3166-1 alpha-2) | ❌ No | Country code, e.g. `CI`, `SN`, `NG` |

**Response:** The newly created vendor profile with status `PENDING_ONBOARDING`.

> A user can only have **one** vendor profile. Attempting to register twice returns `409 Conflict`.

---

### Step 2: Complete Onboarding Information

Update the profile with address and any missing fields.

```http
PATCH /api/v1/vendors/me/onboarding
```

**Request body:**

```json
{
  "region": "Abidjan",
  "city": "Cocody",
  "addressLine1": "Rue des Jardins, Lot 42",
  "postalCode": "01 BP 1234"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vendorType` | `INDIVIDUAL` \| `COMPANY` | ❌ No | Switch type while still in onboarding |
| `legalBusinessName` | string | ❌ No | Update display name |
| `tradeName` | string | ❌ No | Update trade name |
| `taxId` | string | ❌ No | Add or update tax ID |
| `businessEmail` | string | ❌ No | Update email |
| `businessPhone` | string | ❌ No | Update phone |
| `countryCode` | string | ❌ No | Update country |
| `region` | string | ❌ No | Region / state |
| `city` | string | ❌ No | City |
| `addressLine1` | string | ❌ No | Street address |
| `postalCode` | string | ❌ No | Postal code |

**Constraints:**
- Updates are only allowed when status is `PENDING_ONBOARDING` or `REJECTED`.
- If all required fields for the vendor's type are filled, `onboardingCompletedAt` is automatically set.

---

### Step 3: Upload Verification Documents

Documents are uploaded to object storage (e.g., Supabase Storage) first. This endpoint only persists the metadata and URL.

```http
POST /api/v1/vendors/me/documents
```

**Request body:**

```json
{
  "type": "IDENTITY",
  "fileUrl": "https://storage.example.com/vendors/doc-123.pdf",
  "fileName": "passport.pdf",
  "mimeType": "application/pdf"
}
```

**Document types:**

| Type | Recommended For | Description |
|------|----------------|-------------|
| `IDENTITY` | Individuals | Passport, national ID, driver's licence |
| `BUSINESS_REGISTRATION` | Companies | Business licence, registration certificate |
| `TAX_CERTIFICATE` | Companies | Tax ID certificate, VAT registration |
| `BANK_PROOF` | Both | Bank statement, cancelled cheque |
| `OTHER` | Both | Any other supporting document |

**Constraints:**
- Documents can only be added/removed while status is `PENDING_ONBOARDING` or `REJECTED`.

---

### Step 4: Submit for Verification

Once all required fields are filled and at least one document is uploaded, the vendor submits their profile for admin review.

```http
POST /api/v1/vendors/me/submit-verification
```

**No request body.**

**Validation checks:**
1. Status must be `PENDING_ONBOARDING` or `REJECTED`.
2. All required fields for the vendor's type must be filled (see [Field Requirements Matrix](#field-requirements-matrix)).
3. At least one document must be uploaded.

**Response:** The vendor profile with status updated to `PENDING_VERIFICATION`.

> If validation fails, the response lists the missing fields explicitly.

---

### Step 5: Wait for Admin Review

The vendor can check their profile at any time:

```http
GET /api/v1/vendors/me
```

**Response includes:**
- Full vendor profile
- All uploaded documents
- Linked shops
- Last 25 status history records

---

## Admin Review & Approval Flow

### Listing Vendors

Admins can view the vendor queue with filtering and pagination.

```http
GET /api/v1/admin/vendors?status=PENDING_VERIFICATION&vendorType=INDIVIDUAL&take=50
```

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | `VendorStatus` | Filter by status |
| `kycStatus` | `VendorStatus` | Alias for `status` |
| `vendorType` | `INDIVIDUAL` \| `COMPANY` | Filter by vendor type |
| `flaggedForModeration` | boolean | Show only flagged vendors |
| `skip` | integer | Pagination offset (default: 0) |
| `take` | integer | Page size (default: 50, max: 100) |

**Response:**

```json
{
  "items": [ /* Vendor array */ ],
  "total": 120,
  "skip": 0,
  "take": 50
}
```

Each vendor item includes:
- Vendor profile (including `vendorType`)
- Linked user info (`id`, `email`, `role`)
- All documents
- Shop count (`_count.shops`)

---

### Viewing a Single Vendor

```http
GET /api/v1/admin/vendors/:vendorId
```

**Response includes:**
- Full vendor profile
- Linked user details
- All documents
- All shops
- Last 40 status history records
- Product and order counts (`_count.products`, `_count.orders`)

---

### Review Workflow

Admins move vendors through the following review steps:

#### 1. Mark Under Review

```http
POST /api/v1/admin/vendors/:vendorId/review
```

- Moves status from `PENDING_VERIFICATION` → `UNDER_REVIEW`
- Creates an audit record

#### 2. Approve

```http
POST /api/v1/admin/vendors/:vendorId/approve
```

- Moves status from `PENDING_VERIFICATION` or `UNDER_REVIEW` → `APPROVED`
- Sets `reviewedAt` and `reviewedByUserId`
- Clears any previous `rejectionReason`
- Creates an audit record

> Once approved, the vendor can create shops and list products.

#### 3. Reject

```http
POST /api/v1/admin/vendors/:vendorId/reject
```

**Request body:**

```json
{
  "reason": "Identity document is blurry and unreadable. Please re-upload a clear photo."
}
```

- Moves status from `PENDING_VERIFICATION` or `UNDER_REVIEW` → `REJECTED`
- Sets `reviewedAt`, `reviewedByUserId`, and `rejectionReason`
- Creates an audit record with the reason
- The vendor can update their profile and re-submit

#### 4. Suspend

```http
POST /api/v1/admin/vendors/:vendorId/suspend
```

- Moves status to `SUSPENDED` regardless of current status
- Creates an audit record
- Use for violations, fraud, or compliance issues

---

### Flagging for Moderation

```http
PATCH /api/v1/admin/vendors/:vendorId/flags
```

**Request body:**

```json
{
  "flaggedForModeration": true
}
```

- Toggles the moderation flag independently of the status
- Use to mark vendors for additional trust/safety review

---

## Field Requirements Matrix

### Required Before Submitting for Verification

| Field | Individual | Company |
|-------|:----------:|:-------:|
| `vendorType` | ✅ (at registration) | ✅ (at registration) |
| `legalBusinessName` | ✅ | ✅ |
| `businessEmail` | ✅ | ✅ |
| `businessPhone` | ✅ | ✅ |
| `countryCode` | ✅ | ✅ |
| `addressLine1` | ✅ | ✅ |
| `postalCode` | ❌ | ✅ |
| `taxId` | ❌ | ❌ |
| `tradeName` | ❌ | ❌ |
| `region` | ❌ | ❌ |
| `city` | ❌ | ❌ |

### Documents Required Before Submitting

| Type | Minimum Documents | Recommended Document |
|------|:-----------------:|---------------------|
| **Individual** | 1 | `IDENTITY` (passport, national ID) |
| **Company** | 1 | `BUSINESS_REGISTRATION` or `TAX_CERTIFICATE` |

---

## Status Lifecycle

```
PENDING_ONBOARDING
       │
       ▼ (vendor submits)
PENDING_VERIFICATION
       │
       ├──► UNDER_REVIEW ──► APPROVED
       │                        │
       └──► REJECTED ◄──────────┘
              │ (vendor fixes & re-submits)
              └──► PENDING_VERIFICATION

SUSPENDED (admin action from any status)
```

| Status | Meaning |
|--------|---------|
| `PENDING_ONBOARDING` | Vendor profile created but not yet submitted |
| `PENDING_VERIFICATION` | Submitted and waiting in the admin queue |
| `UNDER_REVIEW` | An admin is actively reviewing the case |
| `APPROVED` | Vendor can operate on the platform |
| `REJECTED` | Submission rejected with a reason; vendor can fix and re-submit |
| `SUSPENDED` | Admin-enforced pause (violations, fraud, compliance) |

---

## API Reference

### Vendor Endpoints

All vendor endpoints require authentication with the `vendor` role and the `VENDOR_PROFILE_WRITE` permission.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/vendors/me/register` | Create vendor profile |
| `GET` | `/api/v1/vendors/me` | Get full vendor profile |
| `PATCH` | `/api/v1/vendors/me/onboarding` | Update onboarding fields |
| `POST` | `/api/v1/vendors/me/documents` | Add a document metadata |
| `DELETE` | `/api/v1/vendors/me/documents/:documentId` | Remove a document |
| `POST` | `/api/v1/vendors/me/submit-verification` | Submit for admin review |

### Admin Endpoints

All admin endpoints require authentication with the `admin` or `super_admin` role and the `VENDORS_APPROVE` permission.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/vendors` | List vendors with filters |
| `GET` | `/api/v1/admin/vendors/:vendorId` | Get single vendor detail |
| `POST` | `/api/v1/admin/vendors/:vendorId/review` | Mark as under review |
| `POST` | `/api/v1/admin/vendors/:vendorId/approve` | Approve vendor |
| `POST` | `/api/v1/admin/vendors/:vendorId/reject` | Reject vendor |
| `POST` | `/api/v1/admin/vendors/:vendorId/suspend` | Suspend vendor |
| `PATCH` | `/api/v1/admin/vendors/:vendorId/flags` | Toggle moderation flag |

---

## Quick Start Example

### Individual Vendor Onboarding

```bash
# 1. Register
POST /api/v1/vendors/me/register
{
  "vendorType": "INDIVIDUAL",
  "legalBusinessName": "Koffi's Electronics",
  "businessEmail": "koffi@example.com",
  "businessPhone": "+22507010203",
  "countryCode": "CI"
}

# 2. Add address
PATCH /api/v1/vendors/me/onboarding
{
  "addressLine1": "Rue des Artisans, Lot 15"
}

# 3. Upload ID document
POST /api/v1/vendors/me/documents
{
  "type": "IDENTITY",
  "fileUrl": "https://storage.example.com/id-card.pdf"
}

# 4. Submit
POST /api/v1/vendors/me/submit-verification
```

### Company Vendor Onboarding

```bash
# 1. Register
POST /api/v1/vendors/me/register
{
  "vendorType": "COMPANY",
  "legalBusinessName": "SARL TechAfrique",
  "businessEmail": "contact@techafrique.ci",
  "businessPhone": "+22507040506",
  "countryCode": "CI"
}

# 2. Add address + postal code
PATCH /api/v1/vendors/me/onboarding
{
  "addressLine1": "Zone 4C, Rue du Commerce",
  "postalCode": "01 BP 5678",
  "city": "Abidjan",
  "region": "Abidjan"
}

# 3. Upload business document
POST /api/v1/vendors/me/documents
{
  "type": "BUSINESS_REGISTRATION",
  "fileUrl": "https://storage.example.com/reg-cert.pdf"
}

# 4. Submit
POST /api/v1/vendors/me/submit-verification
```
