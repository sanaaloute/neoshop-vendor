import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

import { getApiBaseUrl } from "@/config/auth";
import { refreshTokensClient } from "@/services/auth-refresh-client";
import { useAuthStore } from "@/store/auth-store";

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

function shouldSkipRefresh(config: InternalAxiosRequestConfig | undefined): boolean {
  if (!config) return true;
  const url = config.url ?? "";
  return url.includes("/auth/logout") || url.includes("/auth/login") || url.includes("/auth/register");
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
      await useAuthStore.getState().logout();
      return Promise.reject(error);
    }

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
  instance.interceptors.response.use(
    (response) => response,
    refreshOnUnauthorized(instance)
  );
}
