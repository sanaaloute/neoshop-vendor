"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { MetricCard } from "@/components/cards/metric-card";
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/cards/dashboard-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWallet } from "@/hooks/use-wallet";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WalletTransaction } from "@/services/vendor/types";

function txnTypeLabel(type: WalletTransaction["type"], t: (key: string) => string): string {
  switch (type) {
    case "credit":
      return t("payouts.txnType.credit");
    case "debit":
      return t("payouts.txnType.debit");
    case "deposit":
      return t("payouts.txnType.deposit");
    case "withdrawal":
      return t("payouts.txnType.withdrawal");
    case "reserve":
      return t("payouts.txnType.reserve");
    case "release":
      return t("payouts.txnType.release");
    case "refund":
      return t("payouts.txnType.refund");
    case "adjustment":
      return t("payouts.txnType.adjustment");
    default:
      return type;
  }
}

function statusBadge(status: WalletTransaction["status"], t: (key: string) => string) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="secondary" className="font-normal tabular-nums">
          {t("payouts.txnStatus.completed")}
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="font-normal tabular-nums">
          {t("payouts.txnStatus.pending")}
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="font-normal tabular-nums">
          {t("payouts.txnStatus.failed")}
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="font-normal tabular-nums">
          {t("payouts.txnStatus.cancelled")}
        </Badge>
      );
    default:
      return null;
  }
}

function parseMoney(value: string): number {
  const n = Number.parseFloat(value.replace(/[+\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function signedCurrency(value: string, currency = "CNY") {
  const n = parseMoney(value);
  const abs = formatCurrency(Math.abs(n), currency);
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return abs;
}

export function PayoutsHome() {
  const t = useTranslations();
  const { currentRate, fetchRate } = useExchangeRates();
  const { balance, transactions, loading, changeCurrency } = useWallet();
  const [currencyBusy, setCurrencyBusy] = useState(false);

  const handleToggleCurrency = () => {
    if (!balance || currencyBusy) return;
    setCurrencyBusy(true);
    changeCurrency(balance.currency === "XOF" ? "CNY" : "XOF").finally(() => {
      setCurrencyBusy(false);
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          index={0}
          label={t("payouts.home.availableBalance")}
          value={
            balance
              ? formatCurrency(parseMoney(balance.availableBalance), balance.currency)
              : "—"
          }
        />
        <MetricCard
          index={1}
          label={t("payouts.home.heldBalance")}
          value={
            balance
              ? formatCurrency(parseMoney(balance.reservedBalance), balance.currency)
              : "—"
          }
        />
        <MetricCard
          index={2}
          label={t("payouts.home.totalBalance")}
          value={
            balance
              ? formatCurrency(parseMoney(balance.totalBalance), balance.currency)
              : "—"
          }
        />
        <MetricCard
          index={3}
          label={t("payouts.home.exchangeRate")}
          value={
            currentRate
              ? `1 ${currentRate.from} = ${currentRate.rate.toFixed(4)} ${currentRate.to}`
              : t("payouts.home.noRate")
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {["USD", "EUR", "GBP", "JPY"].map((to) => (
          <button
            key={to}
            type="button"
            onClick={() => fetchRate(balance?.currency ?? "CNY", to)}
            className="bg-muted/40 border-border/60 hover:bg-muted/60 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
          >
            {balance?.currency ?? "CNY"} → {to}
          </button>
        ))}
        <button
          type="button"
          disabled={currencyBusy || !balance}
          onClick={handleToggleCurrency}
          className="bg-muted/40 border-border/60 hover:bg-muted/60 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {currencyBusy
            ? t("payouts.home.changingCurrency")
            : t("payouts.home.toggleCurrency", {
                currency: balance?.currency === "XOF" ? "CNY" : "XOF",
              })}
        </button>
      </div>

      <DashboardCard className="gap-0 py-0">
        <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
          <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            {t("payouts.home.history")}
          </DashboardCardDescription>
          <DashboardCardTitle className="text-base">
            {t("payouts.home.transactionHistory")}
          </DashboardCardTitle>
        </DashboardCardHeader>
        <DashboardCardContent className="px-0 pt-0 pb-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">{t("payouts.home.table.date")}</TableHead>
                  <TableHead>{t("payouts.home.table.type")}</TableHead>
                  <TableHead>{t("payouts.home.table.description")}</TableHead>
                  <TableHead>{t("payouts.home.table.status")}</TableHead>
                  <TableHead className="pr-4 text-right">{t("payouts.home.table.amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground py-10 text-center"
                    >
                      {t("payouts.home.loadingTransactions")}
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-muted-foreground py-10 text-center"
                    >
                      {t("payouts.home.noTransactions")}
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="text-muted-foreground pl-4 tabular-nums">
                        {new Date(txn.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {txnTypeLabel(txn.type, t)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {txn.description ?? "—"}
                      </TableCell>
                      <TableCell>{statusBadge(txn.status, t)}</TableCell>
                      <TableCell
                        className={cn(
                          "pr-4 text-right font-medium tabular-nums",
                          parseMoney(txn.amount) >= 0
                            ? "text-green-600 dark:text-green-400"
                            : ""
                        )}
                      >
                        {signedCurrency(txn.amount, txn.currency)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DashboardCardContent>
      </DashboardCard>
    </div>
  );
}
