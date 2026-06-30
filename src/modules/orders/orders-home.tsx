"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { StatusBadge } from "@/components/cards/status-badge";
import { GatewaySyncBanner } from "@/components/feedback/gateway-sync-banner";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/feedback/loading-button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { cn } from "@/lib/utils";
import { useGatewayOrdersBootstrap } from "@/hooks/use-gateway-orders-bootstrap";
import { useRefetchVendorOrders } from "@/hooks/use-refetch-vendor-orders";
import { useOrderStats } from "@/hooks/use-order-stats";
import { useOrderDetail } from "@/hooks/use-order-detail";
import type { ApiOrderStatus } from "@/services/vendor/types";
import { useVendorWritesAllowed } from "@/hooks/use-vendor-writes";
import { useOrdersStore } from "@/store/orders-store";

import { OrderDetailModal } from "./order-detail-modal";
import type { OrderStatus } from "./types";
import { ORDER_STATUS_FLOW } from "./types";
import { nextWorkflowStatus, statusLabel } from "./workflow";

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

const ORDER_STATUSES: {
  key: OrderStatus | "cancelled";
  labelKey: string;
  status: Parameters<typeof StatusBadge>[0]["status"];
  clickable: boolean;
}[] = [
  {
    key: "pending_payment",
    labelKey: "status.pendingPayment",
    status: "pending",
    clickable: true,
  },
  { key: "paid", labelKey: "status.paid", status: "info", clickable: true },
  {
    key: "processing",
    labelKey: "status.processing",
    status: "info",
    clickable: true,
  },
  {
    key: "shipped",
    labelKey: "status.shipped",
    status: "warning",
    clickable: true,
  },
  {
    key: "delivered",
    labelKey: "status.delivered",
    status: "success",
    clickable: true,
  },
  {
    key: "disputed",
    labelKey: "status.disputed",
    status: "danger",
    clickable: true,
  },
  {
    key: "refunded",
    labelKey: "status.refunded",
    status: "danger",
    clickable: true,
  },
  {
    key: "cancelled",
    labelKey: "status.cancelled",
    status: "neutral",
    clickable: false,
  },
];

function toApi(s: OrderStatus): ApiOrderStatus {
  return s as ApiOrderStatus;
}

function rowBadge(s: OrderStatus): Parameters<typeof StatusBadge>[0]["status"] {
  if (s === "delivered") return "success";
  if (s === "refunded" || s === "disputed") return "danger";
  if (s === "shipped" || s === "processing" || s === "paid") return "info";
  if (s === "pending_payment") return "pending";
  return "neutral";
}

export function OrdersHome() {
  const t = useTranslations("orders");
  const { canWriteOrders } = useVendorWritesAllowed();
  const orders = useOrdersStore((s) => s.orders);
  const refetch = useRefetchVendorOrders();
  const { updateStatus: updateOrderStatus } = useOrderDetail();
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { loading: gatewayLoading, error: gatewayError } =
    useGatewayOrdersBootstrap();
  const { stats: orderStats } = useOrderStats();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const activeFiltersCount =
    (statusFilter !== "all" ? 1 : 0) + (search ? 1 : 0);

  const clearFilters = useCallback(() => {
    setStatusFilter("all");
    setSearch("");
  }, []);

  const handleStatClick = useCallback((status: OrderStatus) => {
    setStatusFilter((prev) => (prev === status ? "all" : status));
  }, []);

  const openOrder = (id: string) => {
    setActiveOrderId(id);
    setModalOpen(true);
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

  const runBulkAdvance = async () => {
    if (!canWriteOrders) return;
    if (!getApiBaseUrl()) {
      setBulkError(t("marketplaceUnavailable"));
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
        await updateOrderStatus(id, toApi(nxt), undefined, toApi(o.status));
      }
      setRefreshing(true);
      await refetch();
      setSelected(new Set());
    } catch (e) {
      setBulkError(httpErrorMessageForUser(e, t("couldNotAdvance")));
    } finally {
      setBulkBusy(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setBulkError(null);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <GatewaySyncBanner loading={gatewayLoading} error={gatewayError} />

      {/* ── Stat Metric Cards ── */}
      {orderStats ? (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
          }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8"
        >
          {ORDER_STATUSES.map(({ key, labelKey, status, clickable }) => {
            const byStatus = orderStats.byStatus;
            const count =
              key === "pending_payment"
                ? byStatus.pending_payment
                : key === "paid"
                  ? byStatus.paid
                  : key === "processing"
                    ? byStatus.processing
                    : key === "shipped"
                      ? byStatus.shipped
                      : key === "delivered"
                        ? byStatus.delivered
                        : key === "disputed"
                          ? byStatus.disputed
                          : key === "refunded"
                            ? byStatus.refunded
                            : byStatus.cancelled;
            const active = statusFilter === key;
            const Wrapper = clickable ? motion.button : motion.div;
            return (
              <Wrapper
                key={key}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.35, ease: easeOutExpo },
                  },
                }}
                whileHover={
                  clickable
                    ? { y: -3, transition: { duration: 0.25 } }
                    : undefined
                }
                whileTap={clickable ? { scale: 0.97 } : undefined}
                onClick={
                  clickable
                    ? () => handleStatClick(key as OrderStatus)
                    : undefined
                }
                className={cn(
                  "relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-300",
                  "bg-card/80 shadow-vendor-card ring-1 ring-white/5 backdrop-blur-md",
                  "dark:bg-card/60 dark:ring-white/10",
                  !clickable && "opacity-70",
                  active
                    ? "border-primary/50 bg-primary/5 shadow-primary/10 ring-primary/20 shadow-lg"
                    : clickable &&
                        "border-border/60 hover:border-primary/30 hover:shadow-lg"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={status} className="text-[10px]">
                    {t(labelKey)}
                  </StatusBadge>
                  {active && (
                    <motion.div
                      layoutId="order-stat-active"
                      className="bg-primary size-2 rounded-full"
                      transition={{ duration: 0.25, ease: easeOutExpo }}
                    />
                  )}
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                  {count}
                </div>
                <div
                  className={cn(
                    "mt-1 h-0.5 w-full rounded-full transition-colors duration-300",
                    active ? "bg-primary/40" : "bg-border/40"
                  )}
                />
              </Wrapper>
            );
          })}
        </motion.div>
      ) : null}

      {/* ── Toolbar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2, ease: easeOutExpo }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          <div className="bg-primary/15 flex size-9 items-center justify-center rounded-xl">
            <ShoppingBag className="text-primary size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{t("title")}</p>
            <p className="text-muted-foreground text-xs">
              {t("orderPipeline")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg"
            disabled={!getApiBaseUrl() || gatewayLoading || refreshing}
            onClick={() => void handleRefresh()}
          >
            <RefreshCw
              className={cn(
                "size-3.5 transition-transform",
                refreshing && "animate-spin"
              )}
            />
            {t("refresh")}
          </Button>
        </div>
      </motion.div>

      {bulkError ? (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-destructive text-sm"
        >
          {bulkError}
        </motion.p>
      ) : null}

      {/* ── Bulk Actions ── */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.3, ease: easeOutExpo }}
          >
            <Card className="border-primary/30 from-primary/5 shadow-vendor-card overflow-hidden bg-gradient-to-r to-transparent">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/15 flex size-8 items-center justify-center rounded-lg">
                    <span className="text-primary text-xs font-bold">
                      {selected.size}
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {t("bulkActions", { count: selected.size })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LoadingButton
                    type="button"
                    size="sm"
                    loading={bulkBusy}
                    loadingText={t("processing")}
                    disabled={!getApiBaseUrl() || !canWriteOrders}
                    onClick={() => void runBulkAdvance()}
                  >
                    {t("advanceWorkflow")}
                  </LoadingButton>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelected(new Set())}
                  >
                    {t("clearSelection")}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25, ease: easeOutExpo }}
      >
        <Card className="border-border/60 shadow-vendor-card overflow-hidden">
          <div className="from-primary/5 to-chart-2/5 border-border/50 border-b bg-gradient-to-r via-transparent px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs font-medium">
              <SlidersHorizontal className="text-muted-foreground size-3.5" />
              <span className="text-muted-foreground tracking-wider uppercase">
                {t("filters")}
              </span>
              {activeFiltersCount > 0 && (
                <span className="bg-primary/15 text-primary flex size-5 items-center justify-center rounded-full text-[10px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <Label htmlFor="order-search" className="sr-only">
                {t("searchLabel")}
              </Label>
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="order-search"
                className="h-10 pl-10"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5 sm:w-56">
              <Label className="text-muted-foreground text-xs">
                {t("statusFilter")}
              </Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t("allStatuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  {ORDER_STATUS_FLOW.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(statusLabel(s) as string)}
                    </SelectItem>
                  ))}
                  <SelectItem value="disputed">
                    {t(statusLabel("disputed") as string)}
                  </SelectItem>
                  <SelectItem value="refunded">
                    {t(statusLabel("refunded") as string)}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "h-10 gap-1.5",
                activeFiltersCount === 0 && "opacity-50"
              )}
              disabled={activeFiltersCount === 0}
              onClick={clearFilters}
            >
              <RotateCcw className="size-3.5" />
              {t("resetFilters")}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* ── Order Table ── */}
      <Card className="border-border/80 shadow-vendor-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-10 pr-0">
                  <Checkbox
                    disabled={!canWriteOrders}
                    checked={allSelected}
                    onCheckedChange={() =>
                      selectAllVisible(
                        !allSelected,
                        filtered.map((o) => o.id)
                      )
                    }
                    aria-label={t("selectAll")}
                  />
                </TableHead>
                <TableHead className="text-xs font-medium tracking-wider uppercase">
                  {t("reference")}
                </TableHead>
                <TableHead className="hidden text-xs font-medium tracking-wider uppercase md:table-cell">
                  {t("customer")}
                </TableHead>
                <TableHead className="text-xs font-medium tracking-wider uppercase">
                  {t("statusFilter")}
                </TableHead>
                <TableHead className="text-right text-xs font-medium tracking-wider uppercase">
                  {t("total")}
                </TableHead>
                <TableHead className="hidden text-xs font-medium tracking-wider uppercase sm:table-cell">
                  {t("updated")}
                </TableHead>
                <TableHead className="text-right"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-muted-foreground text-center text-sm"
                    >
                      {gatewayLoading && orders.length === 0
                        ? t("loading")
                        : !gatewayLoading &&
                            orders.length === 0 &&
                            getApiBaseUrl()
                          ? t("noOrdersYet")
                          : !gatewayLoading &&
                              orders.length === 0 &&
                              !getApiBaseUrl()
                            ? t("connectMarketplace")
                            : t("noMatches")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((o, i) => (
                    <motion.tr
                      key={o.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        duration: 0.25,
                        delay: i * 0.03,
                        ease: easeOutExpo,
                      }}
                      data-state={selected.has(o.id) ? "selected" : undefined}
                      className={cn(
                        "hover:bg-muted/40 border-b transition-colors",
                        selected.has(o.id) && "bg-primary/5"
                      )}
                      onClick={() => openOrder(o.id)}
                    >
                      <td className="pr-0" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          disabled={!canWriteOrders}
                          checked={selected.has(o.id)}
                          onCheckedChange={() => toggle(o.id)}
                          aria-label={t("selectAll")}
                        />
                      </td>
                      <td className="p-2 px-4">
                        <div className="font-medium">{o.reference}</div>
                        <div className="text-muted-foreground font-mono text-[10px]">
                          {o.id}
                        </div>
                      </td>
                      <td className="text-muted-foreground hidden max-w-[200px] truncate p-2 px-4 md:table-cell">
                        {o.customerName}
                      </td>
                      <td className="p-2 px-4">
                        <StatusBadge status={rowBadge(o.status)}>
                          {t(statusLabel(o.status) as string)}
                        </StatusBadge>
                      </td>
                      <td className="p-2 px-4 text-right font-medium tabular-nums">
                        {formatCurrency(o.total)}
                      </td>
                      <td className="text-muted-foreground hidden p-2 px-4 text-xs sm:table-cell">
                        {new Date(o.updatedAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td
                        className="p-2 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => openOrder(o.id)}
                        >
                          {t("details")}
                        </Button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </Card>

      <OrderDetailModal
        orderId={activeOrderId}
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setActiveOrderId(null);
        }}
      />
    </div>
  );
}
