import { vendorApiClient } from "@/services/api/client";

import type {
  Paginated,
  WalletBalanceResponse,
  WalletTransaction,
} from "./types";

/** GET /wallet/me — get current wallet balance */
export async function getWalletMe() {
  const { data } = await vendorApiClient.get<WalletBalanceResponse>("/api/v1/wallet/me");
  return data;
}

/** GET /wallet/me/transactions — list wallet transactions */
export async function listWalletTransactions(params?: {
  type?: WalletTransaction["type"];
  limit?: number;
  offset?: number;
}) {
  const { data } = await vendorApiClient.get<Paginated<WalletTransaction>>(
    "/api/v1/wallet/me/transactions",
    { params }
  );
  return data;
}

/** POST /wallet/change-currency — toggle/convert wallet currency between XOF and CNY */
export async function changeWalletCurrency(body: { currency: "XOF" | "CNY" }) {
  const { data } = await vendorApiClient.post<WalletBalanceResponse>(
    "/api/v1/wallet/change-currency",
    body
  );
  return data;
}
