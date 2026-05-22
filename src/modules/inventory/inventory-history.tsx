"use client";

import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { StockMovement, StockMovementType, Warehouse } from "./types";

function typeLabel(t: StockMovementType) {
  switch (t) {
    case "receipt":
      return "Receipt";
    case "shipment":
      return "Shipment";
    case "adjustment":
      return "Adjustment";
    case "transfer_in":
      return "Transfer in";
    case "transfer_out":
      return "Transfer out";
    default:
      return t;
  }
}

function typeBadgeVariant(
  t: StockMovementType
): ComponentProps<typeof Badge>["variant"] {
  if (t === "receipt" || t === "transfer_in") return "default";
  if (t === "shipment" || t === "transfer_out") return "secondary";
  return "outline";
}

function whCode(warehouses: Warehouse[], id: string) {
  return warehouses.find((w) => w.id === id)?.code ?? id;
}

type InventoryHistoryProps = {
  movements: StockMovement[];
  warehouses: Warehouse[];
};

export function InventoryHistory({
  movements,
  warehouses,
}: InventoryHistoryProps) {
  if (!movements.length) {
    return (
      <Card className="border-border/80 bg-muted/15 text-muted-foreground border-dashed p-8 text-center text-sm">
        No movements match the history filters.
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-vendor-card overflow-hidden">
      <div className="border-border bg-muted/30 border-b px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">
          Inventory history
        </h2>
        <p className="text-muted-foreground text-xs">
          Stock movements and balances (newest first).
        </p>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">When</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="hidden sm:table-cell">Warehouse</TableHead>
              <TableHead className="text-right">Δ</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="hidden lg:table-cell">Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                  {new Date(m.at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={typeBadgeVariant(m.type)}
                    className="text-[10px]"
                  >
                    {typeLabel(m.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-xs">{m.sku}</div>
                  <div className="text-muted-foreground line-clamp-1 text-[11px]">
                    {m.productName}
                  </div>
                </TableCell>
                <TableCell className="hidden text-xs sm:table-cell">
                  {whCode(warehouses, m.warehouseId)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono text-xs tabular-nums",
                    m.delta > 0 && "text-emerald-600 dark:text-emerald-400",
                    m.delta < 0 && "text-destructive"
                  )}
                >
                  {m.delta > 0 ? `+${m.delta}` : m.delta}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {m.balanceAfter}
                </TableCell>
                <TableCell className="text-muted-foreground hidden max-w-[200px] truncate text-xs lg:table-cell">
                  {m.note ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
