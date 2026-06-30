"use client";

import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Box,
  Calendar,
  Check,
  Clock,
  Edit3,
  FileText,
  MapPin,
  Package,
  Plus,
  Printer,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { Separator } from "@/components/ui/separator";
import { getApiBaseUrl } from "@/config/auth";
import { useVendorWritesAllowed } from "@/hooks/use-vendor-writes";
import { formatCurrency } from "@/lib/format";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { cn } from "@/lib/utils";
import { mapGatewayOrderDetailToVendorOrder } from "@/services/vendor/mappers/orders-from-api";
import {
  getOrder,
  patchOrderStatus,
  patchOrderTracking,
} from "@/services/vendor/orders-api";
import type { ApiOrderStatus } from "@/services/vendor/types";
import { useOrdersStore } from "@/store/orders-store";

import {
  buildInvoiceHtml,
  buildPackingSlipHtml,
  openPrintableDocument,
} from "./print-documents";
import type { OrderStatus, VendorOrder } from "./types";
import { ORDER_STATUS_FLOW, ORDER_STATUS_TRANSITIONS } from "./types";
import { isTerminalStatus, nextWorkflowStatus, statusLabel } from "./workflow";

function badgeVariant(s: OrderStatus): ComponentProps<typeof Badge>["variant"] {
  if (s === "delivered") return "default";
  if (s === "refunded" || s === "disputed" || s === "cancelled")
    return "destructive";
  if (s === "shipped" || s === "processing" || s === "paid") return "secondary";
  return "outline";
}

type OrderDetailModalProps = {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toApiStatus(s: OrderStatus): ApiOrderStatus {
  return s as ApiOrderStatus;
}

function canTransitionTo(current: OrderStatus, next: OrderStatus): boolean {
  if (current === next) return false;
  const allowed = ORDER_STATUS_TRANSITIONS[current] ?? [];
  return allowed.includes(next);
}

function toNumber(value: string | number): number {
  if (typeof value === "number") return Number.isNaN(value) ? 0 : value;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDateTime(at: string) {
  return new Date(at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(at: string) {
  return new Date(at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function OrderDetailModal({
  orderId,
  open,
  onOpenChange,
}: OrderDetailModalProps) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const { canWriteOrders } = useVendorWritesAllowed();
  const orders = useOrdersStore((s) => s.orders);
  const upsertOrder = useOrdersStore((s) => s.upsertOrder);

  const order = useMemo(
    () => (orderId ? orders.find((o) => o.id === orderId) : undefined),
    [orders, orderId]
  );

  const [detailLoading, setDetailLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const [trackingDraft, setTrackingDraft] = useState("");
  const [isTrackingEditing, setIsTrackingEditing] = useState(false);

  const refreshOrderFromApi = useCallback(
    async (id: string) => {
      if (!getApiBaseUrl()) return;
      setDetailLoading(true);
      setActionError(null);
      try {
        const raw = await getOrder(id);
        upsertOrder(
          mapGatewayOrderDetailToVendorOrder(raw as Record<string, unknown>)
        );
      } catch (e) {
        setActionError(httpErrorMessageForUser(e, t("couldNotLoadOrder")));
      } finally {
        setDetailLoading(false);
      }
    },
    [upsertOrder, t]
  );

  useEffect(() => {
    if (!open || !orderId || !getApiBaseUrl()) return;
    void refreshOrderFromApi(orderId);
  }, [open, orderId, refreshOrderFromApi]);

  useEffect(() => {
    if (order?.trackingNumber) {
      setTrackingDraft(order.trackingNumber);
    } else {
      setTrackingDraft("");
    }
    setIsTrackingEditing(false);
  }, [order?.trackingNumber, orderId]);

  const runStatusPatch = async (
    o: VendorOrder,
    status: OrderStatus,
    note?: string
  ) => {
    if (!canWriteOrders) {
      setActionError(t("orderUpdatesLocked"));
      return;
    }
    if (!getApiBaseUrl()) {
      setActionError(t("marketplaceUnavailable"));
      return;
    }
    if (!canTransitionTo(o.status, status)) {
      setActionError(t("invalidStatusTransition"));
      return;
    }
    setActionBusy(true);
    setActionError(null);
    try {
      await patchOrderStatus(o.id, { status: toApiStatus(status), note });
      await refreshOrderFromApi(o.id);
    } catch (e) {
      setActionError(httpErrorMessageForUser(e, t("couldNotUpdateStatus")));
    } finally {
      setActionBusy(false);
    }
  };

  const canEditTracking = (status: OrderStatus) =>
    status === "paid" || status === "processing" || status === "shipped";

  const runTrackingPatch = async (o: VendorOrder) => {
    if (!canWriteOrders) {
      setActionError(t("orderUpdatesLocked"));
      return;
    }
    if (!getApiBaseUrl()) {
      setActionError(t("marketplaceUnavailable"));
      return;
    }
    if (!canEditTracking(o.status)) {
      setActionError(t("invalidStatusTransition"));
      return;
    }
    setActionBusy(true);
    setActionError(null);
    try {
      await patchOrderTracking(o.id, {
        trackingNumber: trackingDraft.trim(),
      });
      setIsTrackingEditing(false);
      await refreshOrderFromApi(o.id);
    } catch (e) {
      setActionError(httpErrorMessageForUser(e, t("couldNotUpdateTracking")));
    } finally {
      setActionBusy(false);
    }
  };

  const cancelTrackingEdit = () => {
    setTrackingDraft(order?.trackingNumber || "");
    setIsTrackingEditing(false);
  };

  if (!open) return null;

  if (!orderId || !order) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("detailTitle")}</DialogTitle>
            <DialogDescription>
              {detailLoading ? t("loadingOrder") : t("selectOrderPrompt")}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const next = nextWorkflowStatus(order.status);
  const terminal = isTerminalStatus(order.status);
  const flowIndex = ORDER_STATUS_FLOW.indexOf(order.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 p-0 shadow-2xl sm:max-w-3xl lg:max-w-4xl">
        {/* Ambient premium glow behind the modal content */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(120% 80% at 10% -10%, color-mix(in oklch, var(--primary) 14%, transparent) 0%, transparent 55%), radial-gradient(90% 60% at 100% 0%, color-mix(in oklch, var(--chart-2) 10%, transparent) 0%, transparent 50%)",
          }}
        />

        <DialogHeader className="border-border/60 relative border-b px-6 py-5 text-left">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="text-primary/80 size-4" aria-hidden />
                <DialogDescription className="font-mono text-[11px] uppercase tracking-wider">
                  {order.id}
                </DialogDescription>
              </div>
              <DialogTitle className="text-2xl leading-tight font-semibold tracking-tight">
                {order.reference}
              </DialogTitle>
              <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <span className="bg-primary/10 inline-flex size-6 items-center justify-center rounded-full">
                    {order.customerName?.charAt(0).toUpperCase() ?? "?"}
                  </span>
                  {order.customerEmail}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <Calendar className="size-3.5" aria-hidden />
                  {formatDate(order.createdAt)}
                </span>
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Badge
                variant={badgeVariant(order.status)}
                className="h-6 rounded-full px-3 text-xs font-medium capitalize"
              >
                {t(statusLabel(order.status) as string)}
              </Badge>
              <p className="text-right text-lg font-semibold tabular-nums tracking-tight">
                {formatCurrency(order.total, order.currency, 0, locale)}
              </p>
            </div>
          </div>
          {actionError ? (
            <p className="text-destructive mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs">
              {actionError}
            </p>
          ) : null}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="animate-children-stagger flex flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6">
            {/* Status workflow */}
            <section className="glass-card hover-lift transition-premium p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Package className="text-primary size-4" aria-hidden />
                    {t("statusWorkflow")}
                  </h3>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {t("statusWorkflowHint")}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={
                    !next || terminal || actionBusy || detailLoading || !canWriteOrders
                  }
                  onClick={() => {
                    if (!next) return;
                    void runStatusPatch(order, next);
                  }}
                  className="shrink-0 gap-1.5"
                >
                  <ArrowRight className="size-3.5" aria-hidden />
                  {t("advanceToStatus", {
                    status: next ? t(statusLabel(next) as string) : "—",
                  })}
                </Button>
              </div>

              <div className="relative">
                <ol className="relative grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-2">
                  {ORDER_STATUS_FLOW.map((st, idx) => {
                    const isCurrent = order.status === st;
                    const isCompleted = idx < flowIndex;
                    return (
                      <li
                        key={st}
                        className={cn(
                          "relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all",
                          isCurrent
                            ? "border-primary/30 bg-primary/10 shadow-[0_0_20px_-4px_color-mix(in_oklch,var(--primary)_30%,transparent)]"
                            : isCompleted
                              ? "border-border/60 bg-muted/30"
                              : "border-transparent bg-muted/20"
                        )}
                      >
                        <span
                          className={cn(
                            "relative z-10 flex size-7 items-center justify-center rounded-full border text-[11px] font-bold transition-all",
                            isCurrent
                              ? "border-primary bg-primary text-primary-foreground glow-pulse"
                              : isCompleted
                                ? "border-primary/40 bg-primary/15 text-primary"
                                : "border-border bg-card text-muted-foreground"
                          )}
                        >
                          {isCompleted ? (
                            <Check className="size-3.5" aria-hidden />
                          ) : (
                            idx + 1
                          )}
                        </span>
                        <span
                          className={cn(
                            "text-[11px] font-medium leading-tight",
                            isCurrent
                              ? "text-foreground"
                              : isCompleted
                                ? "text-foreground"
                                : "text-muted-foreground"
                          )}
                        >
                          {t(statusLabel(st) as string)}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </section>

            {/* Order lines & totals */}
            <section className="glass-card hover-lift transition-premium overflow-hidden">
              <div className="border-border/60 flex items-center justify-between border-b px-4 py-3 sm:px-5 sm:py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Box className="text-primary size-4" aria-hidden />
                  {t("orderSummary")}
                </h3>
                <span className="text-muted-foreground text-xs">
                  {order.lines.length} {order.lines.length === 1 ? t("item") : t("items")}
                </span>
              </div>
              <div className="px-4 sm:px-5">
                <ul className="divide-border/60 divide-y">
                  {order.lines.map((l, index) => (
                    <li
                      key={
                        l.variantId
                          ? `line-${l.variantId}`
                          : `line-${index}-${l.sku}-${l.name}`
                      }
                      className="flex items-center justify-between gap-4 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-medium leading-snug">
                          {l.name}
                        </p>
                        <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                          {l.sku}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatCurrency(toNumber(l.unitPrice) * l.qty, order.currency, 0, locale)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {l.qty} × {formatCurrency(l.unitPrice, order.currency, 0, locale)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-muted/20 border-border/60 border-t px-4 py-3 sm:px-5">
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("subtotal")}</dt>
                    <dd className="tabular-nums">
                      {formatCurrency(order.subtotal, order.currency, 0, locale)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("shipping")}</dt>
                    <dd className="tabular-nums">
                      {formatCurrency(order.shipping, order.currency, 0, locale)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("tax")}</dt>
                    <dd className="tabular-nums">
                      {formatCurrency(order.tax, order.currency, 0, locale)}
                    </dd>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-base font-semibold">
                    <dt>{t("total")}</dt>
                    <dd className="tabular-nums">
                      {formatCurrency(order.total, order.currency, 0, locale)}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-5">
              {/* Shipping address */}
              <section className="glass-card hover-lift transition-premium p-4 sm:p-5 lg:col-span-3">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="text-primary size-4" aria-hidden />
                  {t("shippingAddress")}
                </h3>
                {order.shippingAddress ? (
                  <div className="space-y-3">
                    <Card className="border-border/60 bg-muted/15 p-4 text-sm">
                      <p className="font-medium">{order.shippingAddress.fullName}</p>
                      <p className="text-muted-foreground mt-1 leading-relaxed">
                        {order.shippingAddress.streetLine1}
                        {order.shippingAddress.streetLine2
                          ? `, ${order.shippingAddress.streetLine2}`
                          : null}
                        {" — "}
                        {order.shippingAddress.city}
                        {order.shippingAddress.region
                          ? `, ${order.shippingAddress.region}`
                          : null}{" "}
                        {order.shippingAddress.postalCode}
                        {", "}
                        {order.shippingAddress.country}
                      </p>
                      {order.shippingAddress.phone ? (
                        <p className="text-muted-foreground mt-2 text-xs">
                          {order.shippingAddress.phone}
                        </p>
                      ) : null}
                    </Card>
                    {order.shippingMethod ? (
                      <div className="flex items-center gap-2 rounded-lg bg-muted/20 px-3 py-2 text-xs">
                        <Truck className="text-muted-foreground size-3.5" aria-hidden />
                        <span className="font-medium">{order.shippingMethod.name}</span>
                        <span className="text-muted-foreground">
                          · {order.shippingMethod.type} ·{" "}
                          {order.shippingMethod.estimatedDaysMin}-
                          {order.shippingMethod.estimatedDaysMax} {t("days")}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t("noShippingAddress")}
                  </p>
                )}
              </section>

              {/* Tracking */}
              <section className="glass-card hover-lift transition-premium flex flex-col p-4 sm:p-5 lg:col-span-2">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Truck className="text-primary size-4" aria-hidden />
                  {t("tracking")}
                </h3>
                <div className="flex flex-1 flex-col justify-between gap-3">
                  {isTrackingEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={trackingDraft}
                        onChange={(e) => setTrackingDraft(e.target.value)}
                        placeholder={t("trackingPlaceholder")}
                        className="h-9 text-sm"
                        disabled={actionBusy}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 flex-1"
                          disabled={
                            !trackingDraft.trim() ||
                            actionBusy ||
                            detailLoading ||
                            !canWriteOrders ||
                            !canEditTracking(order.status)
                          }
                          onClick={() => void runTrackingPatch(order)}
                        >
                          <Check className="size-3.5" aria-hidden />
                          {t("save")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1"
                          disabled={actionBusy}
                          onClick={cancelTrackingEdit}
                        >
                          <X className="size-3.5" aria-hidden />
                          {t("cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {order.trackingNumber ? (
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs">{t("trackingNumber")}</p>
                          <p className="break-all font-mono text-sm font-semibold">
                            {order.trackingNumber}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 py-6 text-center">
                          <Package className="text-muted-foreground/60 mb-2 size-8" aria-hidden />
                          <p className="text-muted-foreground text-sm">
                            {t("noTrackingYet")}
                          </p>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={
                          actionBusy ||
                          detailLoading ||
                          !canWriteOrders ||
                          !canEditTracking(order.status)
                        }
                        onClick={() => setIsTrackingEditing(true)}
                      >
                        {order.trackingNumber ? (
                          <>
                            <Edit3 className="size-3.5" aria-hidden />
                            {t("editTracking")}
                          </>
                        ) : (
                          <>
                            <Plus className="size-3.5" aria-hidden />
                            {t("addTracking")}
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </section>
            </div>

            {/* Timeline */}
            <section className="glass-card hover-lift transition-premium p-4 sm:p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Clock className="text-primary size-4" aria-hidden />
                {t("orderTimeline")}
              </h3>
              {order.timeline.length > 0 ? (
                <ul className="relative max-h-64 space-y-0 overflow-y-auto pr-1">
                  <div className="absolute top-2 bottom-2 left-[7px] w-px bg-gradient-to-b from-border via-border to-transparent" />
                  {order.timeline.map((ev) => (
                    <li
                      key={ev.id}
                      className="relative grid grid-cols-[1.25rem_1fr] gap-3 py-2.5"
                    >
                      <span className="relative z-10 mt-1.5 size-2 rounded-full bg-primary/60 ring-4 ring-card" />
                      <div>
                        <p className="text-sm font-medium leading-snug">
                          {ev.label}
                        </p>
                        {ev.detail ? (
                          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                            {ev.detail}
                          </p>
                        ) : null}
                        <time className="text-muted-foreground/80 mt-1 block text-[11px]">
                          {formatDateTime(ev.at)}
                        </time>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">{t("noTimeline")}</p>
              )}
            </section>

            {/* Print actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  openPrintableDocument(
                    `Invoice ${order.reference}`,
                    buildInvoiceHtml(order)
                  )
                }
              >
                <FileText className="size-4" aria-hidden />
                {t("invoice")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  openPrintableDocument(
                    `Packing slip ${order.reference}`,
                    buildPackingSlipHtml(order)
                  )
                }
              >
                <Printer className="size-4" aria-hidden />
                {t("packingSlip")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
