/**
 * OpenAPI SDK integration
 *
 * Generate a typed client from your OpenAPI spec, then bind it to the shared Axios instance
 * so interceptors (Bearer, refresh, retry, cancellation via `signal`) apply to every call.
 *
 * Recommended generators (pick one):
 * - `@hey-api/openapi-ts` — `pnpm exec openapi-ts -i openapi.yaml -o src/services/api/generated`
 * - `openapi-typescript-codegen` — emits axios-based classes
 *
 * Example binding pattern for generators that accept `axios` + `basePath`:
 *
 * ```ts
 * import { Configuration, DefaultApi } from "./generated";
 * import { vendorApiClient } from "@/services/api/client";
 * import { getApiBaseUrl } from "@/config/auth";
 *
 * export const vendorOpenApi = new DefaultApi(
 *   new Configuration({
 *     basePath: getApiBaseUrl() ?? "",
 *     baseOptions: { headers: {} },
 *   }),
 *   undefined,
 *   vendorApiClient
 * );
 * ```
 *
 * For fetch-based generators, prefer wiring `vendorApiClient` only if the tool supports axios;
 * otherwise duplicate base URL from `getApiBaseUrl()` and attach auth headers manually.
 */

import type { AxiosInstance } from "axios";

import { getApiBaseUrl } from "@/config/auth";

import { vendorApiClient } from "./client";

export type OpenApiAxiosBinding = {
  axios: AxiosInstance;
  basePath: string;
};

/** Use when your codegen wants both explicit base path and the authenticated axios instance. */
export function createOpenApiAxiosBinding(
  axiosInstance: AxiosInstance = vendorApiClient,
  basePath: string = getApiBaseUrl() ?? ""
): OpenApiAxiosBinding {
  return { axios: axiosInstance, basePath };
}

export { vendorApiClient };
