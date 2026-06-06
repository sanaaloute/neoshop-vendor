# Frontend Health Monitoring Integration Guide

This document explains how the **Admin Console**, **Vendor Panel**, and **Customer Mobile Apps** integrate with the Barkosem health monitoring livestream.

## Overview

The backend aggregates health across three layers every 15 seconds (configurable):

1. **Infrastructure** — backend API, database, Redis, worker service, API gateway
2. **Frontend Platforms** — Admin Console URL, Vendor Panel URL, mobile app beacons
3. **Business Health** — customer/vendor platform smoke tests (orders, disputes, onboarding, KYC)

The result is pushed to the admin console in real time via Socket.IO and stored in Redis history.

### Health model: three kinds of checks

The schema uses different types because each system is monitored in a **different way**:

| Type | What it measures | Example source | Mapped systems |
|------|------------------|----------------|----------------|
| `FrontendHealth` | **Can the URL be reached?** | Outbound HTTP `HEAD` to the deployed site | `adminConsole`, `vendorPanel` |
| `MobilePlatformHealth` | **Are the mobile apps alive?** | Last beacon timestamp from iOS/Android | `customerMobile` |
| `CustomerPlatformHealth` | **Is the customer business healthy?** | Database aggregates (orders, disputes, payments) | `customerPlatform` |
| `VendorPlatformHealth` | **Is the vendor business healthy?** | Database aggregates (onboarding, KYC, reviews) | `vendorPlatform` |

**Why no `AdminConsoleHealth`?** The admin console is an internal tool. There is no "business metric" to track for it (no orders, no KYC, no disputes). We only need to know if the URL responds — and that is exactly what `FrontendHealth` does. The vendor panel is the same.

**Why two customer types?** `customerMobile` tracks **app availability** (can users open the app?), while `customerPlatform` tracks **business health** (are users placing orders? are disputes spiking?). A mobile app can be perfectly reachable while the business is on fire — or vice versa.

---

## Table of Contents

- [Backend Endpoints](#backend-endpoints)
- [Schemas](#schemas)
- [Admin Console (Next.js)](#admin-console-nextjs)
- [Vendor Panel (Next.js)](#vendor-panel-nextjs)
- [Customer Mobile Apps (Flutter / iOS / Android)](#customer-mobile-apps-flutter--ios--android)

---

## Backend Endpoints

### `POST /api/v1/health/beacon`

**Audience:** Customer mobile apps (iOS / Android)

**Auth:** None (public endpoint)

**Purpose:** Mobile apps report their presence so the backend can determine whether the mobile platform is reachable.

#### Request

```json
{
  "platform": "ios",
  "appVersion": "2.3.1",
  "deviceId": "optional-device-uuid"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platform` | `"ios" \| "android"` | Yes | Mobile platform identifier |
| `appVersion` | `string` | Yes | App version (e.g. `"2.3.1"`) |
| `deviceId` | `string` | No | Unique device identifier |

#### Response — `200 OK`

```json
{ "received": true }
```

#### When to call
- On every app launch (cold start)
- Every **5 minutes** while the app is in the foreground
- Retry once on network failure; never block the UI

---

### `GET /api/v1/admin/health/system`

**Audience:** Admin Console (Next.js)

**Auth:** Admin JWT (`Bearer <supabase_access_token>`)

**Required role:** `admin` or `super_admin`

**Required permission:** `admin.analytics.read`

**Purpose:** Returns the current health snapshot plus the last N historical snapshots for sparkline rendering.

#### Response — `200 OK`

```json
{
  "live": {
    "timestamp": "2026-05-20T13:38:19.000Z",
    "overall": "up",
    "systems": {
      "backendApi": { "status": "up", "latencyMs": 12 },
      "database": { "status": "up", "latencyMs": 45 },
      "redis": { "status": "up", "latencyMs": 3 },
      "workerService": {
        "status": "up",
        "latencyMs": 8,
        "queuesHealthy": true,
        "queues": {
          "general": { "waiting": 2, "active": 1, "completed": 150, "failed": 0, "delayed": 0 },
          "notifications:email": { "waiting": 0, "active": 0, "completed": 42, "failed": 0, "delayed": 0 }
        }
      },
      "apiGateway": { "status": "up", "latencyMs": 15 },
      "adminConsole": { "status": "up", "latencyMs": 120, "url": "https://admin.yourdomain.com" },
      "vendorPanel": { "status": "up", "latencyMs": 95, "url": "https://vendor.yourdomain.com" },
      "customerMobile": {
        "status": "up",
        "iosLastSeen": "2026-05-20T13:37:55.000Z",
        "iosAppVersion": "2.3.1",
        "androidLastSeen": "2026-05-20T13:38:10.000Z",
        "androidAppVersion": "2.3.0"
      },
      "customerPlatform": {
        "status": "up",
        "newCustomers24h": 12,
        "activeSessions": 45,
        "orders24h": 142,
        "openDisputes": 5
      },
      "vendorPlatform": {
        "status": "up",
        "approvedVendors": 89,
        "vendorsPendingOnboarding": 3,
        "stuckOnboarding": 2,
        "pendingKycCases": 8,
        "pendingProductReviews": 4
      }
    }
  },
  "history": [
    { "timestamp": "2026-05-20T13:38:04.000Z", "overall": "up", "systems": { ... } },
    { "timestamp": "2026-05-20T13:37:49.000Z", "overall": "up", "systems": { ... } }
  ]
}
```

The `history` array is ordered **newest first** and contains up to 60 snapshots (configurable).

---

## Schemas

### `HealthStatus`

```ts
type HealthStatus = 'up' | 'degraded' | 'down' | 'unknown';
```

### `BaseServiceHealth`

```ts
interface BaseServiceHealth {
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
}
```

### `WorkerServiceHealth`

Extends `BaseServiceHealth`:

```ts
interface WorkerServiceHealth extends BaseServiceHealth {
  queuesHealthy?: boolean;
  queues?: Record<string, {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }>;
}
```

### `MobilePlatformHealth`

Extends `BaseServiceHealth`:

```ts
interface MobilePlatformHealth extends BaseServiceHealth {
  iosLastSeen?: string | null;
  iosAppVersion?: string | null;
  androidLastSeen?: string | null;
  androidAppVersion?: string | null;
}
```

### `CustomerPlatformHealth`

Extends `BaseServiceHealth`:

```ts
interface CustomerPlatformHealth extends BaseServiceHealth {
  totalCustomers?: number;
  newCustomers24h?: number;
  activeSessions?: number;
  orders24h?: number;
  openDisputes?: number;
  refundedOrders24h?: number;
  failedPayments24h?: number;
}
```

### `VendorPlatformHealth`

Extends `BaseServiceHealth`:

```ts
interface VendorPlatformHealth extends BaseServiceHealth {
  totalVendors?: number;
  approvedVendors?: number;
  vendorsPendingOnboarding?: number;
  stuckOnboarding?: number;
  pendingKycCases?: number;
  pendingProductReviews?: number;
}
```

### `FrontendHealth`

Extends `BaseServiceHealth`:

```ts
interface FrontendHealth extends BaseServiceHealth {
  url?: string;
}
```

### `HealthSnapshot`

```ts
interface HealthSnapshot {
  timestamp: string;
  overall: HealthStatus;
  systems: {
    backendApi: BaseServiceHealth;
    database: BaseServiceHealth;
    redis: BaseServiceHealth;
    workerService: WorkerServiceHealth;
    apiGateway: BaseServiceHealth;
    adminConsole: FrontendHealth;
    vendorPanel: FrontendHealth;
    customerMobile: MobilePlatformHealth;
    customerPlatform: CustomerPlatformHealth;
    vendorPlatform: VendorPlatformHealth;
  };
}
```

---

## Admin Console (Next.js)

### What you must implement

1. **A "System Status" page or widget** that consumes the live health stream.
2. **Socket.IO listener** for real-time pushes.
3. **REST fallback** on initial page load to fetch history.
4. **Optional:** expose a `/_health` route so the backend can validate more than HTTP reachability.

### Step 1 — Connect to Socket.IO

Use the same Socket.IO connection you already have for realtime events (namespace `/realtime`, auth token in `handshake.auth.token`).

```ts
// lib/socket.ts or your existing socket client
import { io } from 'socket.io-client';

const socket = io('https://api.yourdomain.com/realtime', {
  auth: { token: supabaseAccessToken },
  transports: ['websocket', 'polling'],
});
```

### Step 2 — Listen for the health event

```ts
socket.on('neoshop.admin.health.status', (snapshot: HealthSnapshot) => {
  // snapshot.overall: 'up' | 'degraded' | 'down'
  // snapshot.systems.backendApi.status
  // snapshot.systems.customerMobile.iosLastSeen
  // etc.
  updateHealthDashboard(snapshot);
});
```

**Event name:** `neoshop.admin.health.status`

**Room:** `admin:dashboard` (joined automatically when an admin connects)

**Frequency:** every 15 seconds (configurable server-side via `HEALTH_MONITOR_INTERVAL_MS`)

### Step 3 — Fetch history on page load

Before the first Socket.IO tick arrives, fetch the REST endpoint for immediate data + sparkline history.

```ts
const res = await fetch('https://api.yourdomain.com/api/v1/admin/health/system', {
  headers: {
    Authorization: `Bearer ${supabaseAccessToken}`,
  },
});

const { live, history } = await res.json();
renderHealthDashboard(live, history);
```

### Step 4 — UI suggestions

| Component | Data source | Notes |
|-----------|-------------|-------|
| Overall status badge | `live.overall` | Green (`up`), yellow (`degraded`), red (`down`) |
| Service grid | `live.systems` | 10 cards: backendApi, database, redis, workerService, apiGateway, adminConsole, vendorPanel, customerMobile, customerPlatform, vendorPlatform |
| Latency sparklines | `history[i].systems.*.latencyMs` | Render a small line chart per service using the history array |
| Incident log | Derive from history | Detect status transitions in the history array (e.g., `up → degraded`) |
| Queue details | `live.systems.workerService.queues` | Show waiting/failed counts per queue |
| Mobile details | `live.systems.customerMobile` | Show last seen timestamps and app versions |

### Step 5 — Optional: expose `/_health`

If you want the backend to verify that the Next.js build itself is healthy (not just that the CDN responds), create:

```ts
// app/_health/route.ts   (App Router)
// or pages/api/_health.ts (Pages Router)

export async function GET() {
  return Response.json({
    status: 'ok',
    buildId: process.env.NEXT_PUBLIC_BUILD_ID ?? 'unknown',
    timestamp: new Date().toISOString(),
  });
}
```

The backend will `HEAD` your URL first; if it gets `405 Method Not Allowed`, it falls back to `GET` and checks that the response is `2xx`.

---

## Vendor Panel (Next.js)

### What you must implement

Only **one optional step** is recommended.

### Optional: expose `/_health`

Same pattern as the Admin Console. This lets the backend confirm the Vendor Panel is not only reachable but also serving a valid build.

```ts
// app/_health/route.ts
export async function GET() {
  return Response.json({ status: 'ok' });
}
```

The Vendor Panel **does not** need to consume the health stream. The health data is intended for admins only.

---

## Customer Mobile Apps (Flutter / iOS / Android)

### What you must implement

1. **Beacon sender** — call `POST /api/v1/health/beacon` on launch and periodically.
2. **Graceful failure handling** — never block the UI or crash if the beacon fails.

### Step 1 — Send beacon on app launch

```dart
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';

Future<void> sendHealthBeacon() async {
  try {
    final packageInfo = await PackageInfo.fromPlatform();
    final platform = Platform.isIOS ? 'ios' : 'android';

    final response = await http.post(
      Uri.parse('https://api.yourdomain.com/api/v1/health/beacon'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'platform': platform,
        'appVersion': packageInfo.version,
        'deviceId': await getDeviceId(), // optional
      }),
    );

    if (response.statusCode != 200) {
      // Silently log; do not show to user
      debugPrint('Health beacon failed: ${response.statusCode}');
    }
  } catch (e) {
    // Network may be offline — ignore
    debugPrint('Health beacon exception: $e');
  }
}
```

### Step 2 — Repeat every 5 minutes while foregrounded

Use a timer that is active only when the app is in the foreground:

```dart
class HealthBeaconTimer {
  Timer? _timer;

  void start() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(minutes: 5), (_) async {
      await sendHealthBeacon();
    });
    // Send immediately on start
    sendHealthBeacon();
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }
}
```

Wire it to your app lifecycle:

```dart
// In your main app state or a dedicated lifecycle observer
class _MyAppState extends State<MyApp> with WidgetsBindingObserver {
  final _beaconTimer = HealthBeaconTimer();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _beaconTimer.start();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _beaconTimer.stop();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _beaconTimer.start();
    } else if (state == AppLifecycleState.paused) {
      _beaconTimer.stop();
    }
  }
}
```

### Step 3 — No UI work required

The beacon is invisible to the user. If the backend does not receive a beacon within the TTL (default 10 minutes), it marks the corresponding mobile platform as `degraded` or `down` in the admin console.

---

## Environment Variables (Backend)

The backend operator must set these in production:

| Variable | Example | Purpose |
|----------|---------|---------|
| `ADMIN_CONSOLE_URL` | `https://admin.yourdomain.com` | Outbound health check target |
| `VENDOR_PANEL_URL` | `https://vendor.yourdomain.com` | Outbound health check target |
| `WORKER_SERVICE_URL` | `http://worker-service:3001` | Internal worker health/metrics |
| `API_GATEWAY_ADMIN_URL` | `http://api-gateway:8001/status` | Internal Kong status endpoint |
| `HEALTH_MONITOR_INTERVAL_MS` | `15000` | Tick interval (default 15s) |
| `HEALTH_MONITOR_HISTORY_SIZE` | `60` | Snapshots to keep in Redis |
| `CUSTOMER_MOBILE_HEALTH_TTL_SECONDS` | `600` | Beacon TTL before platform is marked down |

---

## Troubleshooting

### Admin console sees `unknown` for Admin Console / Vendor Panel

- The backend has not been configured with `ADMIN_CONSOLE_URL` / `VENDOR_PANEL_URL`.
- Set them in the backend environment and restart.

### Admin console sees `down` for mobile platforms

- The mobile apps are not calling `POST /api/v1/health/beacon`.
- Verify the apps send the beacon on launch and every 5 minutes.

### No Socket.IO events arriving

- Ensure the admin user has `role === admin` or `super_admin`.
- The backend joins the `admin:dashboard` room automatically on Socket.IO connect.
- Check that `REDIS_ENABLED=true` and `REALTIME_ENABLED=true` on the backend.

### Worker queues show no data

- The worker service must have `METRICS_ENABLED=true` for the `/metrics` endpoint to return queue depths.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-20 | Initial implementation: `HealthMonitorModule`, beacon endpoint, Socket.IO livestream, REST snapshot endpoint |
