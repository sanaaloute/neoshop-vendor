# Shipping & Logistics Integration Guide

This document explains how the frontend should interact with shipping methods for customers, vendors, and the admin panel.

---

## Overview

The platform supports **two freight modes**:

| Mode | Pricing Model | Typical Use |
|------|--------------|-------------|
| `SEA` | Per **cubic meter (CBM)** | Bulk, heavy, non-urgent cargo |
| `AIR` | Per **kilogram (kg)** | Light, urgent, high-value cargo |

Each shipping method has:
- `baseCost` — minimum/fixed fee applied to every shipment
- `pricePerCbm` — used when `type = SEA`
- `pricePerKg` — used when `type = AIR`
- `estimatedDaysMin` / `estimatedDaysMax` — delivery window
- `isActive` — whether the method is visible to customers

---

## 1. Customer / Vendor — List Active Shipping Methods

**Endpoint:**
```http
GET /api/v1/shipping/methods
```

**Auth:** Bearer token required. Any authenticated user (`customer`, `vendor`, or `admin`) can call this.

**Response:**
```json
{
  "items": [
    {
      "id": "method-uuid-1",
      "name": "Standard Sea Freight",
      "description": "Economical ocean shipping for bulk goods",
      "type": "SEA",
      "estimatedDaysMin": 14,
      "estimatedDaysMax": 30,
      "baseCost": "50.00",
      "pricePerKg": null,
      "pricePerCbm": "150.00"
    },
    {
      "id": "method-uuid-2",
      "name": "Express Air Cargo",
      "description": "Fast delivery by air",
      "type": "AIR",
      "estimatedDaysMin": 3,
      "estimatedDaysMax": 7,
      "baseCost": "25.00",
      "pricePerKg": "8.50",
      "pricePerCbm": null
    }
  ]
}
```

**Frontend usage:**
- Render this list in the checkout flow so buyers can pick a shipping method.
- Only **active** methods are returned; inactive ones are hidden automatically.

---

## 2. Customer / Vendor — Calculate Shipping Rates

**Endpoint:**
```http
POST /api/v1/shipping/rates
```

**Auth:** Bearer token required.

**Body:**
```json
{
  "addressId": "address-uuid",
  "items": [
    { "variantId": "variant-uuid-1", "quantity": 10 },
    { "variantId": "variant-uuid-2", "quantity": 5 }
  ]
}
```

**Response:**
```json
{
  "methods": [
    {
      "id": "method-uuid-1",
      "name": "Standard Sea Freight",
      "type": "SEA",
      "estimatedDays": "14-30",
      "cost": "75.00"
    },
    {
      "id": "method-uuid-2",
      "name": "Express Air Cargo",
      "type": "AIR",
      "estimatedDays": "3-7",
      "cost": "37.50"
    }
  ]
}
```

**Frontend usage:**
- Call this before checkout to display live shipping quotes.
- The customer selects one `method.id`; pass it to the checkout endpoint as `shippingMethodId`.

---

## 3. Admin — List All Shipping Methods

**Endpoint:**
```http
GET /api/v1/admin/shipping/methods
```

**Auth:** Bearer token required. `admin` or `super_admin` only.

**Response:** Same shape as the public list, but includes **inactive** methods as well.

```json
{
  "items": [
    {
      "id": "method-uuid-1",
      "name": "Standard Sea Freight",
      "type": "SEA",
      "baseCost": "50.00",
      "pricePerCbm": "150.00",
      "isActive": true
    },
    {
      "id": "method-uuid-3",
      "name": "Retired Method",
      "type": "AIR",
      "baseCost": "100.00",
      "pricePerKg": "12.00",
      "isActive": false
    }
  ]
}
```

**Frontend usage:**
- Render this in the admin logistics panel.
- Show an `Active / Inactive` badge per row.

---

## 4. Admin — Get Single Shipping Method

**Endpoint:**
```http
GET /api/v1/admin/shipping/methods/:id
```

**Response:** Full `ShippingMethod` object.

---

## 5. Admin — Create Shipping Method

**Endpoint:**
```http
POST /api/v1/admin/shipping/methods
```

**Body:**
```json
{
  "name": "Economy Sea Freight",
  "description": "Best for large volume orders",
  "type": "SEA",
  "estimatedDaysMin": 21,
  "estimatedDaysMax": 45,
  "baseCost": "35.00",
  "pricePerCbm": "120.00",
  "isActive": true
}
```

**Rules:**
- `type` must be `SEA` or `AIR`.
- Provide `pricePerCbm` for `SEA` and `pricePerKg` for `AIR`. Both are optional at the DB level, but the admin UI should prompt for the correct one based on the selected type.

---

## 6. Admin — Update Shipping Method

**Endpoint:**
```http
PATCH /api/v1/admin/shipping/methods/:id
```

**Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "baseCost": "55.00",
  "pricePerCbm": "160.00",
  "estimatedDaysMax": 35
}
```

---

## 7. Admin — Toggle Active / Disable

**Endpoint:**
```http
PATCH /api/v1/admin/shipping/methods/:id/toggle
```

**Behavior:**
- Flips `isActive` between `true` and `false`.
- No request body needed.

**Response:** Updated method object.

**Frontend usage:**
- Use a switch/toggle button in the admin table.
- Disabled methods immediately disappear from the customer-facing list.

---

## 8. Admin — Delete Shipping Method

**Endpoint:**
```http
DELETE /api/v1/admin/shipping/methods/:id
```

**Behavior:**
- Hard-deletes the method from the database.
- **Blocked** if the method is linked to existing orders.

---

## Summary for Frontend Teams

### Customer / Vendor

| Operation | Endpoint | Method | Auth |
|-----------|----------|--------|------|
| List active methods | `/api/v1/shipping/methods` | `GET` | Customer / Vendor / Admin |
| Calculate rates | `/api/v1/shipping/rates` | `POST` | Customer / Vendor / Admin |

### Admin Panel

| Operation | Endpoint | Method | Auth |
|-----------|----------|--------|------|
| List all methods | `/api/v1/admin/shipping/methods` | `GET` | Admin / Super Admin |
| Get one method | `/api/v1/admin/shipping/methods/:id` | `GET` | Admin / Super Admin |
| Create method | `/api/v1/admin/shipping/methods` | `POST` | Admin / Super Admin |
| Update method | `/api/v1/admin/shipping/methods/:id` | `PATCH` | Admin / Super Admin |
| Toggle active | `/api/v1/admin/shipping/methods/:id/toggle` | `PATCH` | Admin / Super Admin |
| Delete method | `/api/v1/admin/shipping/methods/:id` | `DELETE` | Admin / Super Admin |

### Type → Pricing Field Mapping

| Selected `type` | Field to display / edit | Unit |
|-----------------|------------------------|------|
| `SEA` | `pricePerCbm` | per cubic meter |
| `AIR` | `pricePerKg` | per kilogram |

Always show `baseCost` regardless of type — it represents the minimum fee for the shipment.
