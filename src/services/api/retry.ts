import type { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";

/**
 * Retries transient failures only — never retries 401 (handled by refresh interceptor)
 * or non-idempotent writes unless network error.
 */
export function attachRetryStrategy(instance: AxiosInstance) {
  axiosRetry(instance, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      const status = error.response?.status;
      if (status === 401 || status === 403 || status === 404) return false;
      return axiosRetry.isNetworkOrIdempotentRequestError(error);
    },
  });
}
