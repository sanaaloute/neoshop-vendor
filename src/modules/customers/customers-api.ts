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
    phone: raw.phone ?? null,
    company: null,
    tags: raw.orderCount > 1 ? ["repeat buyer"] : [],
    orderCount: raw.orderCount,
    totalSpent: Number.parseFloat(raw.totalSpent) || 0,
    firstSeen: "",
    lastSeen: "",
    orders: [],
    communications: [],
    activities: [],
    products: raw.products ?? [],
  };
}

export async function fetchVendorCustomers(): Promise<VendorCustomer[]> {
  const data = await listVendorCustomers();
  // API returns { items: [...] }
  const payload = data as { items?: unknown[] } | unknown[];
  const list = Array.isArray(payload)
    ? payload
    : (payload as { items?: unknown[] }).items ?? [];
  return (list as VendorCustomerFromApi[]).map(mapApiToVendorCustomer);
}
