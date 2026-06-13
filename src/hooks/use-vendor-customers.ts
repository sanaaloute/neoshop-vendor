"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { listVendorCustomers } from "@/services/vendor/orders-api";
import type { VendorCustomerFromApi } from "@/services/vendor/types";

export function useVendorCustomers() {
  const [customers, setCustomers] = useState<VendorCustomerFromApi[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listVendorCustomers();
      setCustomers(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load customers."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    customers,
    total,
    loading,
    error,
    refetch,
  };
}
