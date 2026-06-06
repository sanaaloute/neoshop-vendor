import { vendorApiClient } from "@/services/api/client";

import type { Paginated, WalletBalanceResponse, WalletTransaction } from "./types";

/** GET /wallet/me — get current wallet balance */
export async function getWalletMe() {
  const { data } = await vendorApiClient.get<WalletBalanceResponse>("/api/v1/wallet/me");
  return data;
}

/** GET /wallet/me/transactions — list wallet transactions */
export async function listWalletTransactions(params?: { page?: number; limit?: number }) {
  const { data } = await vendorApiClient.get<Paginated<WalletTransaction>>(
    "/api/v1/wallet/me/transactions",
    { params }
  );
  return data;
}
