"use client";

/** Stable key for inventory views. Stock levels come from GET /inventory/variants/:variantId. */
export function useInventoryLive() {
  return { liveKey: "inventory", pulse: 0 };
}
