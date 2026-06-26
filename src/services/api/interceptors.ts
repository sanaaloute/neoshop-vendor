import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

import { getApiBaseUrl } from "@/config/auth";
import {
  getAccessToken,
  getSessionId,
} from "@/lib/auth-storage";
import { refreshTokensClient } from "@/services/auth-refresh-client";

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

function sessionRequestInterceptor(config: InternalAxiosRequestConfig) {
  // The gateway's SessionActiveGuard requires X-Session-Id on authenticated
  // endpoints (not only logout). Send it whenever we have a session id.
  const sessionId = getSessionId();
  if (sessionId) {
    config.headers["X-Session-Id"] = sessionId;
  }
  return config;
}

function shouldSkipRefresh(config: InternalAxiosRequestConfig | undefined): boolean {
  if (!config) return true;
  const url = config.url ?? "";
  return (
    url.includes("/auth/logout") ||
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/forgot-password") ||
    url.includes("/auth/reset-password") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/resend-verification") ||
    url.includes("/auth/change-email") ||
    url.includes("/auth/register/phone") ||
    url.includes("/auth/login/phone")
  );
}

function refreshOnUnauthorized(instance: AxiosInstance) {
  return async (error: AxiosError) => {
    const original = error.config as RetryableRequest | undefined;
    const status = error.response?.status;

    if (!original || original._retry || status !== 401 || shouldSkipRefresh(original)) {
      return Promise.reject(error);
    }

    original._retry = true;
    const next = await refreshTokensClient();
    if (!next) {
      // Refresh failed — mark unauthenticated so the auth gate can redirect.
      // The refresh client clears the localStorage token bundle.
      return Promise.reject(error);
    }

    // The refresh client already updated localStorage and the auth store.
    // Retry the original request with the new access token.
    original.headers.Authorization = `Bearer ${next}`;
    return instance(original);
  };
}

function apiBaseRequestInterceptor(config: InternalAxiosRequestConfig) {
  const base = getApiBaseUrl();
  if (base) {
    config.baseURL = base;
  }
  return config;
}

export function attachVendorInterceptors(instance: AxiosInstance) {
  instance.interceptors.request.use(apiBaseRequestInterceptor);
  instance.interceptors.request.use(authRequestInterceptor);
  instance.interceptors.request.use(sessionRequestInterceptor);
  instance.interceptors.response.use(
    (response) => response,
    refreshOnUnauthorized(instance)
  );
}
