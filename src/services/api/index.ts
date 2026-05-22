/**
 * Vendor REST API layer — Axios client, retries, auth interceptors, cancellation helpers,
 * OpenAPI binding utilities.
 *
 * @module services/api
 */

export { createVendorApiClient, vendorApiClient, vendorHttp } from "./client";
export { attachVendorInterceptors } from "./interceptors";
export { attachRetryStrategy } from "./retry";
export { anySignal, createLinkedAbortController } from "./cancellation";
export { createOpenApiAxiosBinding } from "./openapi";
