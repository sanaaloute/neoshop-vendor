"use client";

import { useState, useCallback, useEffect } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "@/services/vendor/addresses-api";
import type { Address, CreateAddressDto, UpdateAddressDto } from "@/services/vendor/types";

/** CRUD for the vendor's own addresses. */
export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listAddresses();
      setAddresses(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load addresses."));
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(
    async (body: CreateAddressDto) => {
      if (!getApiBaseUrl()) return;
      setLoading(true);
      setError(null);
      try {
        await createAddress(body);
        await refetch();
      } catch (e) {
        setError(httpErrorMessageForUser(e, "Could not create address."));
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  const update = useCallback(
    async (id: string, body: UpdateAddressDto) => {
      if (!getApiBaseUrl()) return;
      setLoading(true);
      setError(null);
      try {
        await updateAddress(id, body);
        await refetch();
      } catch (e) {
        setError(httpErrorMessageForUser(e, "Could not update address."));
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!getApiBaseUrl()) return;
      setLoading(true);
      setError(null);
      try {
        await deleteAddress(id);
        await refetch();
      } catch (e) {
        setError(httpErrorMessageForUser(e, "Could not delete address."));
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { addresses, loading, error, refetch, add, update, remove };
}
