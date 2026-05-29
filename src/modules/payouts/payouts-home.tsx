"use client";

import { useEffect, useState } from "react";

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
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  getWalletMe,
  listWalletTransactions,
} from "@/services/vendor/wallet-api";
import type {
  WalletBalanceResponse,
  WalletTransaction,
} from "@/services/vendor/types";

function txnTypeLabel(type: WalletTransaction["type"]): string {
  switch (type) {
    case "deposit":
      return "Deposit";
    case "withdrawal":
      return "Withdrawal";
    case "payment":
      return "Payment";
    case "payout":
      return "Payout";
    case "refund":
      return "Refund";
    case "hold":
      return "Hold";
    case "release":
      return "Release";
    default:
      return type;
  }
}

function statusBadge(status: WalletTransaction["status"]) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="secondary" className="font-normal tabular-nums">
          Completed
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="font-normal tabular-nums">
          Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="font-normal tabular-nums">
          Failed
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="font-normal tabular-nums">
          Cancelled
        </Badge>
      );
    default:
      return null;
  }
}

function signedCurrency(n: number, currency = "CNY") {
  const abs = formatCurrency(Math.abs(n), currency);
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return abs;
}

export function PayoutsHome() {
  const [balance, setBalance] = useState<WalletBalanceResponse | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getWalletMe(),
      listWalletTransactions({ limit: 50 }),
    ])
      .then(([wallet, txns]) => {
        if (cancelled) return;
        setBalance(wallet);
        setTransactions(txns.items);
      })
      .catch(() => {
        if (cancelled) return;
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          index={0}
          label="Available balance"
          value={
            balance ? formatCurrency(balance.balance, balance.currency) : "—"
          }
        />
        <MetricCard
          index={1}
          label="Held balance"
          value={
            balance
              ? formatCurrency(balance.heldBalance, balance.currency)
              : "—"
          }
        />
      </div>

      <DashboardCard className="gap-0 py-0">
        <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
          <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            History
          </DashboardCardDescription>
          <DashboardCardTitle className="text-base">
            Transaction history
          </DashboardCardTitle>
        </DashboardCardHeader>
        <DashboardCardContent className="px-0 pt-0 pb-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-10 text-center"
                  >
                    Loading transactions…
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-10 text-center"
                  >
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground pl-4 tabular-nums">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {txnTypeLabel(t.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {t.description ?? "—"}
                    </TableCell>
                    <TableCell>{statusBadge(t.status)}</TableCell>
                    <TableCell
                      className={cn(
                        "pr-4 text-right font-medium tabular-nums",
                        t.amount >= 0
                          ? "text-green-600 dark:text-green-400"
                          : ""
                      )}
                    >
                      {signedCurrency(t.amount, t.currency)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DashboardCardContent>
      </DashboardCard>
    </div>
  );
}
