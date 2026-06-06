import axios from "axios";

import { getApiBaseUrl } from "@/config/auth";

import { attachVendorInterceptors } from "./interceptors";
import { attachRetryStrategy } from "./retry";

/**
 * Shared Axios instance for Barkosem vendor REST API (`NEXT_PUBLIC_API_BASE_URL`).
 *
 * Order: retry plugin → interceptors (Bearer + refresh on 401).
 */
export function createVendorApiClient() {
  const instance = axios.create({
    baseURL: getApiBaseUrl() || undefined,
    timeout: 30_000,
  });

  attachRetryStrategy(instance);
  attachVendorInterceptors(instance);

  return instance;
}

/** Singleton for browser/client modules (auth bootstrap should run before first API call). */
export const vendorApiClient = createVendorApiClient();

/** Historical alias — prefer `vendorApiClient`. */
export const vendorHttp = vendorApiClient;
