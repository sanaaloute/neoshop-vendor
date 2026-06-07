"use client";

import { useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  registerNotificationDevice,
  heartbeatNotificationDevice,
  unregisterNotificationDevice,
} from "@/services/vendor/notifications-api";
import type { RegisterDeviceDto } from "@/services/vendor/types";

/** Manage push-notification device tokens for the vendor panel. */
export function useNotificationsDevice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (body: RegisterDeviceDto) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      await registerNotificationDevice(body);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not register device."));
    } finally {
      setLoading(false);
    }
  }, []);

  const heartbeat = useCallback(async (token: string) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      await heartbeatNotificationDevice(token);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not send device heartbeat."));
    } finally {
      setLoading(false);
    }
  }, []);

  const unregister = useCallback(async (token: string) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      await unregisterNotificationDevice(token);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not unregister device."));
    } finally {
      setLoading(false);
    }
  }, []);

  return { register, heartbeat, unregister, loading, error };
}
