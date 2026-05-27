"use client";

import { useMemo, useState } from "react";
import { Radio } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VendorWriteGuardBanner } from "@/components/vendor/vendor-write-guard-banner";
import { GatewaySyncBanner } from "@/components/feedback/gateway-sync-banner";
import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { useGatewayOrdersBootstrap } from "@/hooks/use-gateway-orders-bootstrap";
import { useRefetchVendorOrders } from "@/hooks/use-refetch-vendor-orders";
import { patchOrderStatus } from "@/services/vendor/orders-api";
import type { ApiOrderStatus } from "@/services/vendor/types";
import { useVendorWritesAllowed } from "@/hooks/use-vendor-writes";
import { useOrdersStore } from "@/store/orders-store";

import { OrderDetailDrawer } from "./order-detail-drawer";
import { OrdersList } from "./orders-list";
import type { OrderStatus } from "./types";
import { useOrdersLive } from "./use-orders-live";
import { nextWorkflowStatus } from "./workflow";

function toApi(s: OrderStatus): ApiOrderStatus {
  return s as ApiOrderStatus;
}

export function OrdersHome() {
  const { canWriteOrders, status: vendorStatus } = useVendorWritesAllowed();
  const orders = useOrdersStore((s) => s.orders);
  const refetch = useRefetchVendorOrders();
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const { loading: gatewayLoading, error: gatewayError } =
    useGatewayOrdersBootstrap();

  const { liveKey } = useOrdersLive();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const openOrder = (id: string) => {
    setActiveOrderId(id);
    setDrawerOpen(true);
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = (select: boolean, visibleIds: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (select) {
        visibleIds.forEach((id) => next.add(id));
      } else {
        visibleIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  };

  const selectedIds = useMemo(() => [...selected], [selected]);

  const runBulkAdvance = async () => {
    if (!canWriteOrders) return;
    if (!getApiBaseUrl()) {
      setBulkError("Marketplace connection is not available. You can’t update orders right now.");
      return;
    }
    setBulkBusy(true);
    setBulkError(null);
    try {
      for (const id of selectedIds) {
        const o = orders.find((x) => x.id === id);
        if (!o) continue;
        const nxt = nextWorkflowStatus(o.status);
        if (!nxt) continue;
        await patchOrderStatus(id, { status: toApi(nxt) });
      }
      await refetch();
      setSelected(new Set());
    } catch (e) {
      setBulkError(
        httpErrorMessageForUser(e, "Could not advance selected orders.")
      );
    } finally {
      setBulkBusy(false);
    }
  };

  const runBulkRefund = async () => {
    if (!canWriteOrders) return;
    if (!getApiBaseUrl()) {
      setBulkError("Marketplace connection is not available. You can’t update orders right now.");
      return;
    }
    setBulkBusy(true);
    setBulkError(null);
    try {
      for (const id of selectedIds) {
        await patchOrderStatus(id, {
          status: "refunded",
          note: "Bulk refund from vendor orders list",
        });
      }
      await refetch();
      setSelected(new Set());
    } catch (e) {
      setBulkError(
        httpErrorMessageForUser(e, "Could not refund selected orders.")
      );
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <VendorWriteGuardBanner area="orders" status={vendorStatus} />
      <GatewaySyncBanner loading={gatewayLoading} error={gatewayError} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="gap-1.5 font-normal tabular-nums"
          >
            <Radio className="size-3.5 text-green-500" aria-hidden />
            Orders
          </Badge>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!getApiBaseUrl() || gatewayLoading}
          onClick={() => void refetch()}
        >
          Refresh
        </Button>
      </div>

      {bulkError ? (
        <p className="text-destructive text-sm">{bulkError}</p>
      ) : null}

      {selected.size > 0 ? (
        <Card className="border-primary/30 bg-primary/5 shadow-vendor-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">
              Bulk actions ({selected.size} selected)
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={
                  bulkBusy || !getApiBaseUrl() || !canWriteOrders
                }
                onClick={() => void runBulkAdvance()}
              >
                Advance workflow
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={
                  bulkBusy || !getApiBaseUrl() || !canWriteOrders
                }
                onClick={() => void runBulkRefund()}
              >
                Refund selected
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSelected(new Set())}
              >
                Clear selection
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <OrdersList
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        selected={selected}
        onToggle={toggle}
        onSelectAllVisible={selectAllVisible}
        onOpenOrder={openOrder}
        liveKey={liveKey}
        syncLoading={gatewayLoading}
        allowBulkSelection={canWriteOrders}
      />

      <OrderDetailDrawer
        orderId={activeOrderId}
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o);
          if (!o) setActiveOrderId(null);
        }}
      />
    </div>
  );
}
