"use client";

import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Ban, FileText, Printer, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getApiBaseUrl } from "@/config/auth";
import { useVendorWritesAllowed } from "@/hooks/use-vendor-writes";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { mapGatewayOrderDetailToVendorOrder } from "@/services/vendor/mappers/orders-from-api";
import { getOrder, patchOrderStatus } from "@/services/vendor/orders-api";
import { useShipping } from "@/hooks/use-shipping";
import type { ApiOrderStatus } from "@/services/vendor/types";
import { useOrdersStore } from "@/store/orders-store";

import {
  buildInvoiceHtml,
  buildPackingSlipHtml,
  openPrintableDocument,
} from "./print-documents";
import type { OrderStatus, VendorOrder } from "./types";
import { ORDER_STATUS_FLOW } from "./types";
import { isTerminalStatus, nextWorkflowStatus, statusLabel } from "./workflow";

function badgeVariant(s: OrderStatus): ComponentProps<typeof Badge>["variant"] {
  if (s === "delivered") return "default";
  if (s === "refunded" || s === "disputed") return "destructive";
  if (s === "shipped" || s === "processing" || s === "paid") return "secondary";
  return "outline";
}

type OrderDetailDrawerProps = {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toApiStatus(s: OrderStatus): ApiOrderStatus {
  return s as ApiOrderStatus;
}

export function OrderDetailDrawer({
  orderId,
  open,
  onOpenChange,
}: OrderDetailDrawerProps) {
  const t = useTranslations("orders");
  const { canWriteOrders } = useVendorWritesAllowed();
  const { methods: shippingMethods } = useShipping();
  const orders = useOrdersStore((s) => s.orders);
  const upsertOrder = useOrdersStore((s) => s.upsertOrder);

  const order = useMemo(
    () => (orderId ? orders.find((o) => o.id === orderId) : undefined),
    [orders, orderId]
  );

  const [detailLoading, setDetailLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [shipStatus, setShipStatus] = useState("");

  const resetShipForm = () => {
    setCarrier("");
    setTracking("");
    setShipStatus("");
  };

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
        setActionError(
          httpErrorMessageForUser(e, t("couldNotLoadOrder"))
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [upsertOrder, t]
  );

  useEffect(() => {
    resetShipForm();
  }, [orderId]);

  useEffect(() => {
    if (!open || !orderId || !getApiBaseUrl()) return;
    void refreshOrderFromApi(orderId);
  }, [open, orderId, refreshOrderFromApi]);

  const runStatusPatch = async (o: VendorOrder, status: OrderStatus, note?: string) => {
    if (!canWriteOrders) {
      setActionError(t("orderUpdatesLocked"));
      return;
    }
    if (!getApiBaseUrl()) {
      setActionError(t("marketplaceUnavailable"));
      return;
    }
    setActionBusy(true);
    setActionError(null);
    try {
      await patchOrderStatus(o.id, { status: toApiStatus(status), note });
      await refreshOrderFromApi(o.id);
    } catch (e) {
      setActionError(
        httpErrorMessageForUser(
          e,
          t("couldNotUpdateStatus")
        )
      );
    } finally {
      setActionBusy(false);
    }
  };

  if (!open) return null;

  if (!orderId) {
    return null;
  }

  if (!order) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl"
          showCloseButton
        >
          <SheetHeader>
            <SheetTitle>{t("detailTitle")}</SheetTitle>
            <SheetDescription>
              {detailLoading
                ? t("loadingOrder")
                : t("selectOrderPrompt")}
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const next = nextWorkflowStatus(order.status);
  const terminal = isTerminalStatus(order.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl"
        showCloseButton
      >
        <SheetHeader className="border-border border-b px-4 py-4 text-left">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <SheetTitle className="text-lg">{order.reference}</SheetTitle>
              <SheetDescription className="font-mono text-xs">
                {order.id}
              </SheetDescription>
            </div>
            <Badge variant={badgeVariant(order.status)} className="capitalize">
              {t(statusLabel(order.status) as string)}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            {order.customerName} · {order.customerEmail}
          </p>
          {actionError ? (
            <p className="text-destructive mt-2 text-xs">{actionError}</p>
          ) : null}
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 px-4 py-4">
          <section>
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              {t("statusWorkflow")}
            </h3>
            <div className="flex flex-wrap gap-1">
              {ORDER_STATUS_FLOW.map((st) => (
                <span
                  key={st}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    order.status === st
                      ? "border-primary bg-primary/15 text-foreground"
                      : "bg-muted/50 text-muted-foreground border-transparent"
                  )}
                >
                  {t(statusLabel(st) as string)}
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={
                  !next ||
                  terminal ||
                  actionBusy ||
                  detailLoading ||
                  !canWriteOrders
                }
                onClick={() => {
                  if (!next) return;
                  void runStatusPatch(order, next);
                }}
              >
                <ArrowRight className="size-4" aria-hidden />
                {t("nextStatus", { status: next ? t(statusLabel(next) as string) : "—" })}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={
                  terminal || actionBusy || detailLoading || !canWriteOrders
                }
                onClick={() =>
                  void runStatusPatch(
                    order,
                    "refunded",
                    t("markedRefundedFromDrawer")
                  )
                }
              >
                <Ban className="size-4" aria-hidden />
                {t("cancelOrder")}
              </Button>
            </div>
          </section>

          <Separator />

          <section>
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              {t("lines")}
            </h3>
            <ul className="space-y-2 text-sm">
              {order.lines.map((l) => (
                <li
                  key={`${l.sku}-${l.name}`}
                  className="border-border/60 bg-muted/20 flex justify-between gap-2 rounded-md border px-2 py-1.5"
                >
                  <span className="min-w-0">
                    <span className="text-muted-foreground font-mono text-xs">
                      {l.sku}
                    </span>
                    <br />
                    <span className="line-clamp-2">{l.name}</span>
                  </span>
                  <span className="shrink-0 text-right tabular-nums">
                    ×{l.qty}
                    <br />
                    {formatCurrency(l.unitPrice * l.qty)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 grid grid-cols-2 gap-1 text-xs">
              <dt className="text-muted-foreground">{t("subtotal")}</dt>
              <dd className="text-right tabular-nums">
                {formatCurrency(order.subtotal)}
              </dd>
              <dt className="text-muted-foreground">{t("shipping")}</dt>
              <dd className="text-right tabular-nums">
                {formatCurrency(order.shipping)}
              </dd>
              <dt className="text-muted-foreground">{t("tax")}</dt>
              <dd className="text-right tabular-nums">
                {formatCurrency(order.tax)}
              </dd>
              <dt className="font-medium">{t("total")}</dt>
              <dd className="text-right font-medium tabular-nums">
                {formatCurrency(order.total)}
              </dd>
            </dl>
          </section>

          <Separator />

          <section>
            <h3 className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <Truck className="size-3.5" aria-hidden />
              {t("shippingUpdates")}
            </h3>
            {shippingMethods.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-1">
                {shippingMethods.map((m) => (
                  <span
                    key={m.id}
                    className="bg-muted/40 border-border/60 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium"
                    title={m.description ?? ""}
                  >
                    {m.name} · {formatCurrency(m.baseCost, m.currency)}
                  </span>
                ))}
              </div>
            ) : null}
            <Card className="border-border/70 bg-muted/15 p-3">
              <p className="text-muted-foreground mb-2 text-[11px]">
                Carrier and tracking are saved on the order when you update
                fulfillment.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-1">
                  <Label className="text-xs">{t("carrier")}</Label>
                  <Input
                    className="h-8 text-sm"
                    value={carrier}
                    disabled={!canWriteOrders}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder={t("carrierPlaceholder")}
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">{t("tracking")}</Label>
                  <Input
                    className="h-8 text-sm"
                    value={tracking}
                    disabled={!canWriteOrders}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder={t("trackingPlaceholder")}
                  />
                </div>
                <div className="grid gap-1 sm:col-span-2">
                  <Label className="text-xs">{t("statusLabel")}</Label>
                  <Input
                    className="h-8 text-sm"
                    value={shipStatus}
                    disabled={!canWriteOrders}
                    onChange={(e) => setShipStatus(e.target.value)}
                    placeholder={t("statusLabelPlaceholder")}
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="mt-3"
                disabled={
                  !carrier.trim() ||
                  !tracking.trim() ||
                  !shipStatus.trim() ||
                  actionBusy ||
                  detailLoading ||
                  !canWriteOrders
                }
                onClick={() => {
                  const note = [
                    `Carrier: ${carrier.trim()}`,
                    `Tracking: ${tracking.trim()}`,
                    `Label: ${shipStatus.trim()}`,
                  ].join(" · ");
                  void runStatusPatch(order, "shipped", note);
                  resetShipForm();
                }}
              >
                {t("recordShippingUpdate")}
              </Button>
            </Card>
            {order.shippingHistory.length ? (
              <ul className="mt-2 space-y-1.5 text-xs">
                {order.shippingHistory.map((s) => (
                  <li
                    key={s.id}
                    className="border-border/50 rounded-md border px-2 py-1.5"
                  >
                    <span className="font-medium">{s.carrier}</span> ·{" "}
                    <span className="font-mono">{s.trackingNumber}</span>
                    <br />
                    <span className="text-muted-foreground">
                      {s.statusLabel}
                    </span>{" "}
                    · {new Date(s.at).toLocaleString()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground mt-2 text-xs">
                {t("noTrackingEvents")}
              </p>
            )}
          </section>

          <Separator />

          <section className="min-h-0 flex-1">
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              {t("orderTimeline")}
            </h3>
            <ul className="max-h-56 space-y-2 overflow-y-auto pr-1 text-xs">
              {order.timeline.map((ev) => (
                <li
                  key={ev.id}
                  className="border-primary/30 text-muted-foreground border-l-2 pl-3"
                >
                  <span className="text-foreground font-medium">
                    {ev.label}
                  </span>
                  {ev.detail ? (
                    <>
                      <br />
                      <span>{ev.detail}</span>
                    </>
                  ) : null}
                  <br />
                  <time className="text-[10px] opacity-80">
                    {new Date(ev.at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
            {!order.timeline.length ? (
              <p className="text-muted-foreground text-xs">
                {t("noTimeline")}
              </p>
            ) : null}
          </section>

          <div className="border-border mt-auto flex flex-wrap gap-2 border-t pt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
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
      </SheetContent>
    </Sheet>
  );
}
