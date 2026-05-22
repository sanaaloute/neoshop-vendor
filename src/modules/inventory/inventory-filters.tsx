"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StockMovementType, Warehouse } from "./types";

export type MovementFilterType = "all" | StockMovementType;

type InventoryFiltersProps = {
  search: string;
  onSearchChange: (v: string) => void;
  warehouseId: string;
  onWarehouseChange: (id: string) => void;
  warehouses: Warehouse[];
  lowOnly: boolean;
  onLowOnlyChange: (v: boolean) => void;
  movementType: MovementFilterType;
  onMovementTypeChange: (t: MovementFilterType) => void;
  onResetDemo?: () => void;
};

export function InventoryFilters({
  search,
  onSearchChange,
  warehouseId,
  onWarehouseChange,
  warehouses,
  lowOnly,
  onLowOnlyChange,
  movementType,
  onMovementTypeChange,
  onResetDemo,
}: InventoryFiltersProps) {
  return (
    <Card className="border-border/80 shadow-vendor-card p-4 md:p-5">
      <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
        <div className="relative lg:col-span-4">
          <Label htmlFor="inv-search" className="sr-only">
            Search SKU or product
          </Label>
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            id="inv-search"
            className="h-9 pl-9"
            placeholder="Search SKU or product…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5 lg:col-span-3">
          <Label htmlFor="inv-wh" className="text-xs">
            Warehouse
          </Label>
          <select
            id="inv-wh"
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
            value={warehouseId}
            onChange={(e) => onWarehouseChange(e.target.value)}
          >
            <option value="all">All warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} · {w.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5 lg:col-span-3">
          <Label htmlFor="inv-mov" className="text-xs">
            History movement type
          </Label>
          <select
            id="inv-mov"
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
            value={movementType}
            onChange={(e) =>
              onMovementTypeChange(e.target.value as MovementFilterType)
            }
          >
            <option value="all">All types</option>
            <option value="receipt">Receipt</option>
            <option value="shipment">Shipment</option>
            <option value="adjustment">Adjustment</option>
            <option value="transfer_in">Transfer in</option>
            <option value="transfer_out">Transfer out</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-primary size-4"
              checked={lowOnly}
              onChange={(e) => onLowOnlyChange(e.target.checked)}
            />
            Low stock only
          </label>
        </div>
      </div>
      {onResetDemo ? (
        <div className="border-border mt-3 flex justify-end border-t pt-3">
          <Button type="button" variant="ghost" size="sm" onClick={onResetDemo}>
            Reset filters
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
