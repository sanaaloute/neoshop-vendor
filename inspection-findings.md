# NeoShop Vendor Dashboard — Inspection Findings Tracker

Status legend: `open`, `in_progress`, `fixed`, `wontfix`, `deferred`

---

## 🔴 Critical

| # | Status | Issue | File(s) | Fix |
|---|--------|-------|---------|-----|
| 1 | fixed | `/api/auth/me` falls back to unverified JWT decode | `src/app/api/auth/me/route.ts:25-37` | Removed fallback; now returns 401 on verification failure |
| 2 | fixed | "Save Selected Variants" deletes unselected backend variants | `src/modules/variants/variants-home.tsx:324-338` | Added `deleteOrphans` option; Save Selected no longer deletes unselected backend variants |
| 3 | fixed | "Cancel Order" actually marks order as `refunded` | `src/modules/orders/order-detail-drawer.tsx:287-298`, `src/modules/orders/workflow.ts` | Cancel now uses `cancelled`; workflow helpers treat cancelled as terminal |
| 4 | fixed | Bulk product patch lets vendors set `published`/`archived` | `src/services/vendor/product-gateway-sync.ts:147-169` | Removed `published`/`archived` from vendor-controlled statuses |
| 5 | fixed | Dev chat WebSocket relay has no authentication | `scripts/vendor-chat-ws.mjs` | Restricted to localhost; added best-effort token decode + role/exp checks; added warnings |
| 6 | fixed | Raw WebSocket chat fallback connects without credentials | `src/modules/chat/use-vendor-chat-realtime.ts` (deleted), `src/modules/chat/messaging-home.tsx` | Removed raw WebSocket fallback; chat uses authenticated Socket.IO only |

## 🟠 High

| # | Status | Issue | File(s) | Fix |
|---|--------|-------|---------|-----|
| 7 | fixed | Cookie `Secure` flag defaults to `false` | `src/lib/vendor-http-cookie-base.ts:6` | Now defaults to secure in production unless `COOKIE_SECURE=false` |
| 8 | fixed | Long-lived access-token cookie | `src/app/api/auth/session/route.ts:35`, `src/app/api/auth/refresh/route.ts:94` | Access cookie max-age now derived from JWT `exp` (fallback 1h) |
| 9 | fixed | Access token exposed to client memory via `/api/auth/token` | `src/app/api/auth/token/route.ts:7-14` | Added same-origin + CSRF protection; client now sends CSRF header |
| 10 | fixed | Middleware only decodes JWT, does not verify signature | `src/middleware.ts:55` | Middleware now verifies JWT with gateway JWKS; forged tokens are rejected |
| 11 | fixed | `PermissionGate` defined but never used | `src/components/permissions/permission-gate.tsx` | Added `PermissionRouteGate` wrapper in vendor layout; gates pages by route permission |
| 12 | fixed | `/api/v1/[[...path]]` proxy lacks CSRF/cookie auth | `src/app/api/v1/[[...path]]/route.ts` | Added same-origin check; proxy reads httpOnly cookie + CSRF for cookie-based mutating requests; restricted response headers |
| 13 | fixed | Dev notifications WebSocket is unauthenticated | `scripts/notifications-ws.mjs` | Restricted to localhost; added security warnings |
| 14 | fixed | User object persisted to `localStorage` | `src/store/auth-store.ts:346-347` | Removed `user` from persisted state; only `sessionId` remains |
| 15 | fixed | Socket.IO fallback to polling leaks token into logs | `src/realtime/create-socket.ts:12-42` | Changed to `transports: ["websocket"]` to avoid polling handshake leakage |

## 🟡 Medium — API / Type Wiring

| # | Status | Issue | File(s) | Fix |
|---|--------|-------|---------|-----|
| 16 | fixed | Catalog product/variant prices typed as `number` | `src/services/vendor/types.ts:792, 803` | Changed `wholesalePrice` to `string` |
| 17 | fixed | `ReferralMeResponse.earnedAmount: number` | `src/services/vendor/types.ts:696` | Changed to `string` |
| 18 | fixed | Shipping costs typed as `number` | `src/services/vendor/shipping-api.ts:10, 30`, `src/hooks/use-shipping.ts` | Changed `baseCost`/`cost` to `string`; updated consumer state type |
| 19 | fixed | Review response uses `body` but guide uses `comment` | `src/services/vendor/types.ts:502-517` | Added `comment` field; kept `body` as alias for backwards compatibility |
| 20 | fixed | `listCatalogProducts` missing `currency` query param | `src/services/vendor/catalog-api.ts:6-12` | Added `currency?: "XOF" | "CNY"` |
| 21 | fixed | Disputes list uses `page`/`limit` | `src/services/vendor/disputes-api.ts:12-17` | Changed to `skip`/`take` |
| 22 | fixed | `GET /orders/vendor` uses undocumented `status` query | `src/services/vendor/orders-api.ts:13-19` | Documented as backend extension; retained with comment |
| 23 | fixed | `OrderDetailResponse` missing nested `variant` | `src/services/vendor/types.ts:359-385` | Already had `OrderDetailItem.variant`; added clarifying comment for invoices/payments/refunds |
| 24 | fixed | Analytics fields optional though guide shows required | `src/services/vendor/types.ts:423-496` | Made dashboard/products/inventory fields required per guide |
| 25 | fixed | Setup endpoints missing | `src/services/vendor/setup-api.ts` | Added `GET /setup/status` and `POST /setup/bootstrap-admin` helpers |
| 26 | fixed | Variant API functions return `unknown` | `src/services/vendor/variants-api.ts`, `src/services/vendor/types.ts` | Added `ProductVariant`/`PaginatedProductVariants` types; all variant endpoints now typed |
| 27 | fixed | Error handler ignores `details.fields` and `code` | `src/lib/http-error-message.ts:6-46` | Now reads `details.fields` first; added `httpErrorCode` helper for stable codes |

## 🟡 Medium — Chat / Translation

| # | Status | Issue | File(s) | Fix |
|---|--------|-------|---------|-----|
| 28 | fixed | Chat types diverge from guide | `src/modules/chat/types.ts`, `src/services/vendor/mappers/chat-from-api.ts` | Added required `conversationId`, `createdAt`, `senderUserId`, `messageType`; aligned participant fields |
| 29 | fixed | Raw WebSocket chat transport conflicts with Socket.IO guide | `src/modules/chat/use-vendor-chat-realtime.ts` (deleted), `src/modules/chat/messaging-home.tsx`, `scripts/vendor-chat-ws.mjs` | Removed raw WebSocket fallback; chat now uses Socket.IO exclusively |
| 30 | fixed | Language switcher doesn't sync with backend preference | `src/components/navigation/language-switcher.tsx` | Now calls `PATCH /users/me/settings` with `preferredLanguage` on locale change |
| 31 | fixed | Settings save sends all fields | `src/modules/settings/settings-home.tsx:117,156,211-234` | Tracks `originalSettings`; sends only dirty fields |
| 32 | fixed | Preview uses role heuristic not `senderUserId` | `src/modules/chat/messaging-home.tsx:408` | Now compares `senderUserId` against current user IDs |
| 33 | fixed | No thumbnail resolution for image previews | `src/modules/chat/messaging-home.tsx:137,250-287,497-514` | Added `previewSignedUrls` state + effect; renders image thumbnail in list |

## 🟡 Medium — Logic / State

| # | Status | Issue | File(s) | Fix |
|---|--------|-------|---------|-----|
| 34 | fixed | `accessToken` not persisted | `src/store/auth-store.ts` | `accessToken` is now persisted; `user` is no longer persisted in `localStorage` |
| 35 | fixed | Inventory bootstrap N+1 query explosion | `src/hooks/use-gateway-inventory-bootstrap.ts` | Throttled batch/lazy load |
| 36 | fixed | Notifications double-count via two channels | `src/realtime/bridge.tsx`, `src/modules/notifications/use-notifications-ws.ts` | Single channel/dedupe |
| 37 | fixed | Phantom local products preserved forever | `src/store/product-catalog-store.ts` | Clear after sync |
| 38 | fixed | Stale-price fallback hides API `0` | `src/store/product-catalog-store.ts` | Merge uses `{ ...ex, ...p }`; API `0` is trusted and not replaced by stale local price |
| 39 | fixed | Inventory clamps negative stock to 0 | `src/store/inventory-store.ts` | No longer clamps negative stock |
| 40 | fixed | `mergeThreads` never updates latest message | `src/store/chat-store.ts` | Merges server latest message |
| 41 | fixed | Shop bootstrap reads stale store state | `src/hooks/use-shop-gateway-bootstrap.ts` | Re-reads current state before patch |
| 42 | fixed | Variant bootstrap mutates input product | `src/hooks/use-gateway-variants-bootstrap.ts` | Clones before mutate |
| 43 | fixed | `use-user-lifecycle.ts` doesn't update auth after suspend | `src/hooks/use-user-lifecycle.ts` | `suspend()` now `await`s `logout()` so the auth store is cleared immediately |
| 44 | fixed | Product list price mapping uses undocumented fields | `src/services/vendor/mappers/catalog-from-api.ts` | Price now derived only from documented `variants[0].wholesalePrice`; removed `row.price`/`row.wholesalePrice` fallback |
| 45 | fixed | Orders `updateStatus` has no transition validation | `src/hooks/use-order-detail.ts`, `src/modules/orders/order-detail-drawer.tsx`, `src/modules/orders/types.ts` | `ORDER_STATUS_TRANSITIONS` map; enforced in hook and drawer |
| 46 | fixed | Bulk refund has no status guard | `src/modules/orders/orders-home.tsx` | Refund only allowed from `paid`/`processing`/`shipped`/`delivered`; passes current status to hook |
| 47 | fixed | Slug auto-generation overwrites manual edits | `src/modules/products/product-form.tsx`, `src/components/forms/vendor-text-field.tsx` | Tracks manual slug edits; auto-generation stops after user interaction; regenerate button resets guard |
| 48 | fixed | Variant matrix save is sequential | `src/modules/variants/variants-home.tsx` | Attributes sync in parallel; missing values created per attribute in a single batched call |

## 🟡 Medium — Security / Rendering

| # | Status | Issue | File(s) | Fix |
|---|--------|-------|---------|-----|
| 49 | fixed | CSP allows `'unsafe-inline'` and `'unsafe-eval'` | `src/middleware.ts`, `next.config.ts` | Per-request nonce CSP in production; removed `'unsafe-inline'`/`'unsafe-eval'` for scripts (dev keeps unsafe for HMR) |
| 50 | fixed | CSP `connect-src` allows any WebSocket host | `src/middleware.ts`, `next.config.ts` | `connect-src` restricted to `'self'`, API origin, and Socket.IO origin; broad `ws:`/`wss:` removed |
| 51 | fixed | Notification `href` rendered without validation | `src/modules/notifications/notifications-panel.tsx` | Validates same-origin/relative URLs before rendering as `next/link` |
| 52 | fixed | Real-time payloads not validated before store merge | `src/realtime/bridge.tsx`, `src/realtime/schemas.ts` | Added Zod schemas for all realtime payloads; handlers parse and reject malformed events before store merge |
| 53 | fixed | Client-side-only upload validation | `src/lib/upload-config.ts`, `src/lib/upload-proxy-validation.ts`, `src/app/api/v1/[[...path]]/route.ts`, `src/modules/products/product-media-gallery.tsx`, `src/modules/onboarding/steps/documents-step-form.tsx`, `src/modules/chat/messaging-home.tsx` | Shared upload limits; API proxy validates multipart uploads; client upload zones enforce MIME/size limits |
| 54 | fixed | Rate limiting is client-side only | `src/lib/rate-limit.ts`, auth login forms | Documented as non-authoritative UX-only helper; `useRateLimit` no longer gates requests; upstream gateway is authoritative |

---

Last updated: 2026-06-20
