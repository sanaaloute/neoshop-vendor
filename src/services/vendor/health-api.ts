import { vendorApiClient } from "@/services/api/client";

import type { HealthBeaconRequest, HealthLiveResponse, HealthReadyResponse } from "./types";

/** GET /health — full health check */
export async function getGatewayHealth() {
  const { data } = await vendorApiClient.get("/api/v1/health");
  return data;
}

/** GET /health/live — liveness probe */
export async function getGatewayHealthLive() {
  const { data } = await vendorApiClient.get<HealthLiveResponse>("/api/v1/health/live");
  return data;
}

/** GET /health/ready — readiness probe */
export async function getGatewayHealthReady() {
  const { data } = await vendorApiClient.get<HealthReadyResponse>("/api/v1/health/ready");
  return data;
}

/** GET /health/customers — platform health (customer-facing services) */
export async function getGatewayHealthCustomers() {
  const { data } = await vendorApiClient.get("/api/v1/health/customers");
  return data;
}

/** GET /health/vendors — platform health (vendor-facing services) */
export async function getGatewayHealthVendors() {
  const { data } = await vendorApiClient.get("/api/v1/health/vendors");
  return data;
}

/** POST /health/beacon — client heartbeat / telemetry beacon */
export async function postHealthBeacon(body: HealthBeaconRequest) {
  const { data } = await vendorApiClient.post("/api/v1/health/beacon", body);
  return data;
}
