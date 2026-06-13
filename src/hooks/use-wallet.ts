"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  changeWalletCurrency,
  getWalletMe,
  listWalletTransactions,
} from "@/services/vendor/wallet-api";
import type {
  WalletBalanceResponse,
  WalletTransaction,
} from "@/services/vendor/types";

export function useWallet() {
  const [balance, setBalance] = useState<WalletBalanceResponse | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const [balanceData, txnsData] = await Promise.all([
        getWalletMe(),
        listWalletTransactions({ limit: 50 }),
      ]);
      setBalance(balanceData);
      setTransactions(txnsData.items);
      setTotal(txnsData.total);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load wallet."));
    } finally {
      setLoading(false);
    }
  }, []);

  const changeCurrency = useCallback(async (currency: "XOF" | "CNY") => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await changeWalletCurrency({ currency });
      setBalance(data);
      await refetch();
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not change wallet currency."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [refetch]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    balance,
    transactions,
    total,
    loading,
    error,
    refetch,
    changeCurrency,
  };
}
