"use client";

import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";

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

function typeLabel(t: StockMovementType): string {
  switch (t) {
    case "receipt":
      return "inventory.movementTypes.receipt";
    case "shipment":
      return "inventory.movementTypes.shipment";
    case "adjustment":
      return "inventory.movementTypes.adjustment";
    case "transfer_in":
      return "inventory.movementTypes.transfer_in";
    case "transfer_out":
      return "inventory.movementTypes.transfer_out";
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
  const t = useTranslations("inventory");

  if (!movements.length) {
    return (
      <Card className="border-border/80 bg-muted/15 text-muted-foreground border-dashed p-8 text-center text-sm">
        {t("noLinesMatch")}
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-vendor-card overflow-hidden">
      <div className="border-border bg-muted/30 border-b px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">
          {t("inventoryHistory")}
        </h2>
        <p className="text-muted-foreground text-xs">
          {t("historySubtitle")}
        </p>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">{t("when")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("sku")}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("warehouse")}</TableHead>
              <TableHead className="text-right">{t("delta")}</TableHead>
              <TableHead className="text-right">{t("balance")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("note")}</TableHead>
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
                    {t(typeLabel(m.type) as any)}
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
                    m.delta > 0 && "text-green-600 dark:text-green-400",
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
