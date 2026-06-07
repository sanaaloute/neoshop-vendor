import { vendorApiClient } from "@/services/api/client";

import type { Address, CreateAddressDto, UpdateAddressDto } from "./types";

/** GET /addresses — list addresses for the current user */
export async function listAddresses() {
  const { data } = await vendorApiClient.get<Address[]>("/api/v1/addresses");
  return data;
}

/** POST /addresses — create a new address */
export async function createAddress(body: CreateAddressDto) {
  const { data } = await vendorApiClient.post<Address>("/api/v1/addresses", body);
  return data;
}

/** PATCH /addresses/:addressId — update an existing address */
export async function updateAddress(addressId: string, body: UpdateAddressDto) {
  const { data } = await vendorApiClient.patch<Address>(`/api/v1/addresses/${addressId}`, body);
  return data;
}

/** DELETE /addresses/:addressId — delete an address */
export async function deleteAddress(addressId: string) {
  await vendorApiClient.delete(`/api/v1/addresses/${addressId}`);
}
