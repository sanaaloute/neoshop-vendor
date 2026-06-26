const STORAGE_KEYS = {
  accessToken: "nv_access_token",
  refreshToken: "nv_refresh_token",
  sessionId: "nv_session_id",
  expiresAt: "nv_expires_at",
  deviceId: "nv_vendor_device_id",
} as const;

export type AuthBundle = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresAt: number;
};

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore quota / private-mode errors.
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

export function getAccessToken(): string | null {
  return safeGet(STORAGE_KEYS.accessToken);
}

export function getRefreshToken(): string | null {
  return safeGet(STORAGE_KEYS.refreshToken);
}

export function getSessionId(): string | null {
  const value = safeGet(STORAGE_KEYS.sessionId);
  return value && value.length > 0 ? value : null;
}

export function getExpiresAt(): number | null {
  const raw = safeGet(STORAGE_KEYS.expiresAt);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getDeviceId(): string | null {
  return safeGet(STORAGE_KEYS.deviceId);
}

export function setDeviceId(deviceId: string): void {
  safeSet(STORAGE_KEYS.deviceId, deviceId);
}

export function setAuthBundle(bundle: Partial<AuthBundle>): void {
  if (bundle.accessToken !== undefined) {
    safeSet(STORAGE_KEYS.accessToken, bundle.accessToken);
  }
  if (bundle.refreshToken !== undefined) {
    safeSet(STORAGE_KEYS.refreshToken, bundle.refreshToken);
  }
  if (bundle.sessionId !== undefined && bundle.sessionId.length > 0) {
    safeSet(STORAGE_KEYS.sessionId, bundle.sessionId);
  }
  if (bundle.expiresAt !== undefined) {
    safeSet(STORAGE_KEYS.expiresAt, String(bundle.expiresAt));
  }
}

export function clearAuthBundle(): void {
  safeRemove(STORAGE_KEYS.accessToken);
  safeRemove(STORAGE_KEYS.refreshToken);
  safeRemove(STORAGE_KEYS.sessionId);
  safeRemove(STORAGE_KEYS.expiresAt);
}

/** Read the full token bundle from localStorage. */
export function readAuthBundle(): Partial<AuthBundle> {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  const sessionId = getSessionId();
  const expiresAt = getExpiresAt();
  return {
    ...(accessToken && { accessToken }),
    ...(refreshToken && { refreshToken }),
    ...(sessionId && { sessionId }),
    ...(expiresAt && { expiresAt }),
  };
}
