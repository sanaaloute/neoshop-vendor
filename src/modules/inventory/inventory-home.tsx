"use client";

import { useMemo, useState } from "react";
import { Radio } from "lucide-react";

import { GatewaySyncBanner } from "@/components/feedback/gateway-sync-banner";
import { Badge } from "@/components/ui/badge";
import { useGatewayInventoryBootstrap } from "@/hooks/use-gateway-inventory-bootstrap";
import { useInventoryStore } from "@/store/inventory-store";

import { InventoryAnalytics } from "./inventory-analytics";
import { InventoryCards } from "./inventory-cards";
import type { MovementFilterType } from "./inventory-filters";
import { InventoryFilters } from "./inventory-filters";
import { InventoryHistory } from "./inventory-history";
import { isLowStock } from "./types";
import { useInventoryLive } from "./use-inventory-live";

export function InventoryHome() {
  const lines = useInventoryStore((s) => s.lines);
  const movements = useInventoryStore((s) => s.movements);
  const warehouses = useInventoryStore((s) => s.warehouses);
  const resetInventoryDemo = useInventoryStore((s) => s.resetInventoryDemo);

  const gatewaySync = useGatewayInventoryBootstrap();
  const { liveKey } = useInventoryLive();

  const [search, setSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState<string>("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [movementType, setMovementType] = useState<MovementFilterType>("all");

  const filteredLines = useMemo(() => {
    return lines.filter((l) => {
      if (warehouseId !== "all" && l.warehouseId !== warehouseId) return false;
      if (lowOnly && !isLowStock(l)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !l.sku.toLowerCase().includes(q) &&
          !l.productName.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [lines, warehouseId, lowOnly, search]);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (warehouseId !== "all" && m.warehouseId !== warehouseId) return false;
      if (movementType !== "all" && m.type !== movementType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !m.sku.toLowerCase().includes(q) &&
          !m.productName.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [movements, warehouseId, movementType, search]);

  const lowAlertCount = useMemo(() => {
    return lines.filter(
      (l) =>
        (warehouseId === "all" || l.warehouseId === warehouseId) &&
        isLowStock(l)
    ).length;
  }, [lines, warehouseId]);

  return (
    <div className="flex flex-col gap-6">
      <GatewaySyncBanner
        loading={gatewaySync.loading}
        error={gatewaySync.error}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1.5 font-normal tabular-nums">
          <Radio className="size-3.5 text-green-500" aria-hidden />
          Inventory
        </Badge>
      </div>

      {lowAlertCount > 0 ? (
        <div
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-900 dark:text-red-100"
          role="status"
        >
          <strong className="font-semibold">Low inventory:</strong>{" "}
          {lowAlertCount} SKU{lowAlertCount === 1 ? "" : "s"} at or below
          reorder in the selected warehouse scope. Adjust filters to scope
          alerts.
        </div>
      ) : null}

      <InventoryAnalytics lines={filteredLines} liveKey={liveKey} />

      <InventoryFilters
        search={search}
        onSearchChange={setSearch}
        warehouseId={warehouseId}
        onWarehouseChange={setWarehouseId}
        warehouses={warehouses}
        lowOnly={lowOnly}
        onLowOnlyChange={setLowOnly}
        movementType={movementType}
        onMovementTypeChange={setMovementType}
        onResetDemo={resetInventoryDemo}
      />

      <InventoryCards
        lines={filteredLines}
        warehouses={warehouses}
        liveKey={liveKey}
      />

      <InventoryHistory movements={filteredMovements} warehouses={warehouses} />
    </div>
  );
}
