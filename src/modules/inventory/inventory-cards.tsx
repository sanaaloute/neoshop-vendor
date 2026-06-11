"use client";

import { useState } from "react";
import { AlertTriangle, Package } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { cn } from "@/lib/utils";
import { adjustVariantQuantity } from "@/services/vendor/inventory-api";
import { useInventoryStore } from "@/store/inventory-store";

import type { InventoryLine, Warehouse } from "./types";
import { availableToPromise, isLowStock } from "./types";

function whLabel(warehouses: Warehouse[], id: string) {
  const w = warehouses.find((x) => x.id === id);
  return w ? `${w.code}` : id;
}

type InventoryCardsProps = {
  lines: InventoryLine[];
  warehouses: Warehouse[];
  liveKey: string;
};

export function InventoryCards({
  lines,
  warehouses,
  liveKey,
}: InventoryCardsProps) {
  const t = useTranslations("inventory");
  const adjustStock = useInventoryStore((s) => s.adjustStock);
  const [error, setError] = useState<string | null>(null);

  const runAdjustment = async (
    line: InventoryLine,
    delta: number,
    note?: string
  ) => {
    setError(null);
    adjustStock(line.id, delta, "adjustment", note ?? t("manualAdjustment"));
    if (!getApiBaseUrl()) return;
    try {
      await adjustVariantQuantity(line.id, { delta });
    } catch (e) {
      adjustStock(
        line.id,
        -delta,
        "adjustment",
        t("revertedFailed")
      );
      setError(
        httpErrorMessageForUser(
          e,
          t("couldNotUpdate", { sku: line.sku })
        )
      );
    }
  };

  if (!lines.length) {
    return (
      <Card className="border-border/80 bg-muted/15 text-muted-foreground border-dashed p-10 text-center text-sm">
        {t("noLinesMatch")}
      </Card>
    );
  }

  return (
    <>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div key={liveKey} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {lines.map((line) => (
          <InventoryLineCard
            key={line.id}
            line={line}
            warehouseLabel={whLabel(warehouses, line.warehouseId)}
            onAdjust={(delta, note) => void runAdjustment(line, delta, note)}
          />
        ))}
      </div>
    </>
  );
}

function InventoryLineCard({
  line,
  warehouseLabel,
  onAdjust,
}: {
  line: InventoryLine;
  warehouseLabel: string;
  onAdjust: (delta: number, note?: string) => void;
}) {
  const t = useTranslations("inventory");
  const [deltaInput, setDeltaInput] = useState("");
  const atp = availableToPromise(line);
  const low = isLowStock(line);
  const critical = line.onHand <= Math.max(0, line.reorderPoint - 10);
  const maxBar = Math.max(line.reorderPoint * 2.5, line.onHand, 1);
  const fillPct = Math.min(100, Math.round((line.onHand / maxBar) * 100));

  return (
    <Card
      size="sm"
      className={cn(
        "shadow-vendor-card overflow-hidden transition-colors",
        critical && "ring-destructive/40 ring-2",
        low && !critical && "ring-1 ring-red-500/45"
      )}
    >
      <CardHeader className="border-border/60 border-b pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-muted-foreground truncate font-mono text-[11px]">
              {line.sku}
            </p>
            <CardTitle className="mt-0.5 line-clamp-2 text-sm leading-snug">
              {line.productName}
            </CardTitle>
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {warehouseLabel}
          </Badge>
        </div>
        {low ? (
          <div className="mt-2 flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1 text-xs text-red-700 dark:text-red-400">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
            <span>
              {t("atOrBelowReorder", { onHand: line.onHand, reorderPoint: line.reorderPoint })}
            </span>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-3 pt-3">
        <div>
          <div className="text-muted-foreground mb-1 flex justify-between text-[11px]">
            <span>{t("stockLevelVsBuffer")}</span>
            <span className="tabular-nums">{fillPct}%</span>
          </div>
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                critical
                  ? "bg-destructive"
                  : low
                    ? "bg-red-500"
                    : "bg-primary"
              )}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-muted/50 rounded-md py-2">
            <dt className="text-muted-foreground">{t("onHand")}</dt>
            <dd className="font-semibold tabular-nums">{line.onHand}</dd>
          </div>
          <div className="bg-muted/50 rounded-md py-2">
            <dt className="text-muted-foreground">{t("reserved")}</dt>
            <dd className="font-semibold tabular-nums">{line.reserved}</dd>
          </div>
          <div className="bg-muted/50 rounded-md py-2">
            <dt className="text-muted-foreground">{t("atp")}</dt>
            <dd className="font-semibold tabular-nums">{atp}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="border-border bg-muted/30 flex flex-col gap-2 border-t">
        <div className="flex w-full gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onAdjust(5, t("quickPlus5"))}
          >
            +5
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onAdjust(-5, t("quickMinus5"))}
          >
            −5
          </Button>
        </div>
        <div className="flex w-full flex-wrap items-end gap-2">
          <div className="grid min-w-0 flex-1 gap-1">
            <Label className="text-muted-foreground text-[10px]">
              {t("adjustment")}
            </Label>
            <Input
              className="h-8 font-mono text-xs tabular-nums"
              inputMode="numeric"
              placeholder={t("adjustmentPlaceholder")}
              value={deltaInput}
              onChange={(e) => setDeltaInput(e.target.value)}
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="h-8 shrink-0"
            onClick={() => {
              const n = Number.parseInt(deltaInput, 10);
              if (!Number.isFinite(n) || n === 0) return;
              onAdjust(n, `Manual ${n >= 0 ? "+" : ""}${n}`);
              setDeltaInput("");
            }}
          >
            <Package className="size-3.5" aria-hidden />
            {t("apply")}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
