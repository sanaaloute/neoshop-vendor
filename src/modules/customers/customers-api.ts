import { listVendorCustomers } from "@/services/vendor/orders-api";

import type { VendorCustomer, VendorCustomerFromApi } from "./types";

function mapApiToVendorCustomer(raw: VendorCustomerFromApi): VendorCustomer {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    company: null,
    tags: raw.orderCount > 1 ? ["repeat buyer"] : [],
    orderCount: raw.orderCount,
    totalSpend: raw.totalSpend,
    firstSeen: raw.createdAt,
    lastSeen: raw.createdAt,
    orders: [],
    communications: [],
    activities: [],
  };
}

export async function fetchVendorCustomers(): Promise<VendorCustomer[]> {
  const data = await listVendorCustomers();
  const list = Array.isArray(data) ? data : [];
  return (list as VendorCustomerFromApi[]).map(mapApiToVendorCustomer);
}
