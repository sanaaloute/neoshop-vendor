const STORAGE_KEY = "nv_vendor_device_id";

/** Stable id for POST /auth/sessions (4..128 chars). */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") {
    return "vendor-dashboard-server";
  }
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id || id.length < 4) {
      id = crypto.randomUUID();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
