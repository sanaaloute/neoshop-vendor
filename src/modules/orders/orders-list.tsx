"use client";

import { useMemo } from "react";
import { Loader2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiBaseUrl } from "@/config/auth";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useOrdersStore } from "@/store/orders-store";

import type { OrderStatus } from "./types";
import { ORDER_STATUS_FLOW } from "./types";
import { statusLabel } from "./workflow";

function rowBadge(s: OrderStatus) {
  if (s === "delivered") return "default" as const;
  if (s === "refunded" || s === "disputed") return "destructive" as const;
  if (s === "shipped" || s === "processing" || s === "paid") {
    return "secondary" as const;
  }
  return "outline" as const;
}

type OrdersListProps = {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: OrderStatus | "all";
  onStatusFilterChange: (v: OrderStatus | "all") => void;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAllVisible: (select: boolean, visibleIds: string[]) => void;
  onOpenOrder: (id: string) => void;
  liveKey: string;
  /** True while orders are loading from the server */
  syncLoading?: boolean;
  /** When false, row selection is disabled (e.g. vendor not yet approved). */
  allowBulkSelection?: boolean;
};

export function OrdersList({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selected,
  onToggle,
  onSelectAllVisible,
  onOpenOrder,
  liveKey,
  syncLoading = false,
  allowBulkSelection = true,
}: OrdersListProps) {
  const orders = useOrdersStore((s) => s.orders);
  const api = getApiBaseUrl();

  const filtered = useMemo(() => {
    return orders
      .filter((o) => {
        if (statusFilter !== "all" && o.status !== statusFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const inRef = o.reference.toLowerCase().includes(q);
          const inEmail = o.customerEmail.toLowerCase().includes(q);
          const inSku = o.lines.some((l) => l.sku.toLowerCase().includes(q));
          const inName = o.customerName.toLowerCase().includes(q);
          if (!inRef && !inEmail && !inSku && !inName) return false;
        }
        return true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [orders, statusFilter, search]);

  const allSelected =
    filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  const hasFilters = search.trim().length > 0 || statusFilter !== "all";

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border/80 shadow-vendor-card p-4 md:p-5">
        <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
          <div className="relative lg:col-span-5">
            <Label htmlFor="order-search" className="sr-only">
              Search orders
            </Label>
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              id="order-search"
              className="h-9 pl-9"
              placeholder="Search reference, customer, SKU…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5 lg:col-span-4">
            <Label htmlFor="order-status" className="text-xs">
              Status
            </Label>
            <select
              id="order-status"
              className="border-input bg-background h-9 rounded-md border px-2 text-sm"
              value={statusFilter}
              onChange={(e) =>
                onStatusFilterChange(e.target.value as OrderStatus | "all")
              }
            >
              <option value="all">All statuses</option>
              {ORDER_STATUS_FLOW.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
              <option value="disputed">{statusLabel("disputed")}</option>
              <option value="refunded">{statusLabel("refunded")}</option>
            </select>
          </div>
        </div>
      </Card>

      {!filtered.length ? (
        <Card className="border-border/80 bg-muted/15 text-muted-foreground border-dashed p-10 text-center text-sm">
          {syncLoading && orders.length === 0 ? (
            <span className="inline-flex flex-col items-center gap-3">
              <Loader2
                className="text-primary size-8 animate-spin"
                aria-hidden
              />
              <span>Loading…</span>
            </span>
          ) : !syncLoading && orders.length === 0 && api && !hasFilters ? (
            <span>No orders yet.</span>
          ) : !syncLoading && orders.length === 0 && !api ? (
            <span>Connect to your marketplace.</span>
          ) : (
            <span>No matches.</span>
          )}
        </Card>
      ) : (
        <Card
          key={liveKey}
          className="border-border/80 shadow-vendor-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pr-0">
                    <input
                      type="checkbox"
                      className="accent-primary size-4"
                      disabled={!allowBulkSelection}
                      checked={allSelected}
                      onChange={() =>
                        onSelectAllVisible(
                          !allSelected,
                          filtered.map((o) => o.id)
                        )
                      }
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Customer
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Updated
                  </TableHead>
                  <TableHead className="text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow
                    key={o.id}
                    data-state={selected.has(o.id) ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={() => onOpenOrder(o.id)}
                  >
                    <TableCell
                      className="pr-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="accent-primary size-4"
                        disabled={!allowBulkSelection}
                        checked={selected.has(o.id)}
                        onChange={() => onToggle(o.id)}
                        aria-label={`Select ${o.reference}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{o.reference}</div>
                      <div className="text-muted-foreground font-mono text-[10px]">
                        {o.id}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-[200px] truncate md:table-cell">
                      {o.customerName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={rowBadge(o.status)}
                        className="capitalize"
                      >
                        {statusLabel(o.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(o.total)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-xs sm:table-cell">
                      {new Date(o.updatedAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "h-8"
                        )}
                        onClick={() => onOpenOrder(o.id)}
                      >
                        Details
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
