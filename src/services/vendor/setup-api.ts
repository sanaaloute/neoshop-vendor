import { vendorApiClient } from "@/services/api/client";

import type { SetupBootstrapRequest, SetupStatusResponse } from "./types";

/** GET /setup/status — check whether setup token is required and bootstrap is possible */
export async function getSetupStatus() {
  const { data } = await vendorApiClient.get<SetupStatusResponse>("/api/v1/setup/status");
  return data;
}

/** POST /setup/bootstrap-admin — create the first platform administrator */
export async function bootstrapAdmin(body: SetupBootstrapRequest) {
  const { data } = await vendorApiClient.post("/api/v1/setup/bootstrap-admin", body);
  return data;
}
