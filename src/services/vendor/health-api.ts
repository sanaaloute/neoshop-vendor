import { vendorApiClient } from "@/services/api/client";

/** GET /health — public */
export async function getGatewayHealth() {
  const { data } = await vendorApiClient.get("/api/v1/health");
  return data;
}
