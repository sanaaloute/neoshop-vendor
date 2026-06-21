import { vendorApiClient } from "@/services/api/client";

export type SetupStatusResponse = {
  bootstrapAvailable: boolean;
  setupTokenRequired: boolean;
};

export type BootstrapAdminRequest = {
  supabaseUserId: string;
  email: string;
};

/** GET /setup/status — check whether bootstrap is available */
export async function getSetupStatus() {
  const { data } = await vendorApiClient.get<SetupStatusResponse>("/api/v1/setup/status");
  return data;
}

/** POST /setup/bootstrap-admin — create the first admin user */
export async function bootstrapAdmin(body: BootstrapAdminRequest) {
  const { data } = await vendorApiClient.post<unknown>("/api/v1/setup/bootstrap-admin", body);
  return data;
}
