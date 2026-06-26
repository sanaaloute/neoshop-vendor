const STORAGE_KEY = "nv_vendor_device_id";

function generateDeviceId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to manual UUID v4.
  }

  try {
    const bytes = new Uint8Array(16);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    // Version 4 UUID: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where y is 8-9-a-b.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  } catch {
    // Last-resort stable-ish id based on timestamp + random.
    return `vendor-device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

/** Stable id for POST /auth/sessions (4..128 chars). */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") {
    return "vendor-dashboard-server";
  }
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id || id.length < 4) {
      id = generateDeviceId();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return generateDeviceId();
  }
}
