import { listVendorCustomers } from "@/services/vendor/orders-api";

import type { VendorCustomer, VendorCustomerFromApi } from "./types";

function buildDisplayName(raw: VendorCustomerFromApi): string {
  const parts = [raw.name, raw.surname].filter(Boolean);
  return parts.join(" ") || raw.email || raw.phone || "Unknown";
}

function mapApiToVendorCustomer(raw: VendorCustomerFromApi): VendorCustomer {
  return {
    id: raw.userId,
    name: buildDisplayName(raw),
    email: raw.email ?? "",
    company: null,
    tags: raw.orderCount > 1 ? ["repeat buyer"] : [],
    orderCount: raw.orderCount,
    totalSpend: 0,
    firstSeen: "",
    lastSeen: "",
    orders: [],
    communications: [],
    activities: [],
  };
}

export async function fetchVendorCustomers(): Promise<VendorCustomer[]> {
  const data = await listVendorCustomers();
  // API returns { items: [...] }
  const payload = data as { items?: unknown } | unknown[];
  const list = Array.isArray(payload)
    ? payload
    : (payload as { items?: unknown[] }).items ?? [];
  return (list as VendorCustomerFromApi[]).map(mapApiToVendorCustomer);
}
