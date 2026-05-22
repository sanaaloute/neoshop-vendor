"use client";

import { useMemo } from "react";
import { Mail, MessageSquare, ShoppingBag, StickyNote } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/format";
import type { OrderStatus } from "@/modules/orders/types";
import { ORDER_STATUS_FLOW } from "@/modules/orders/types";
import { statusLabel } from "@/modules/orders/workflow";
import { useOrdersStore } from "@/store/orders-store";

import type { VendorCustomer } from "./types";

type PurchaseRow = {
  at: string;
  reference: string;
  total: number;
  status: string;
};

function displayOrderStatus(s: string) {
  const all = [...ORDER_STATUS_FLOW, "disputed", "refunded"] as const;
  if ((all as readonly string[]).includes(s)) {
    return statusLabel(s as OrderStatus);
  }
  return s;
}

function mergePurchases(customer: VendorCustomer): PurchaseRow[] {
  return [...customer.orders]
    .map((s) => ({
      at: s.at,
      reference: s.reference,
      total: s.total,
      status: s.status,
    }))
    .sort((a, b) => b.at.localeCompare(a.at));
}

function activityIcon(kind: VendorCustomer["activities"][number]["kind"]) {
  switch (kind) {
    case "order_placed":
      return ShoppingBag;
    case "email_open":
      return Mail;
    case "support":
      return MessageSquare;
    default:
      return StickyNote;
  }
}

type CustomerProfileDrawerProps = {
  customers: VendorCustomer[];
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CustomerProfileDrawer({
  customers,
  customerId,
  open,
  onOpenChange,
}: CustomerProfileDrawerProps) {
  const orders = useOrdersStore((s) => s.orders);

  const customer = useMemo(
    () => (customerId ? customers.find((c) => c.id === customerId) : undefined),
    [customers, customerId]
  );

  const purchaseTimeline = useMemo(
    () => (customer ? mergePurchases(customer) : []),
    [customer]
  );

  const liveForCustomer = useMemo(() => {
    if (!customer) return [];
    const e = customer.email.toLowerCase();
    return orders.filter((o) => o.customerEmail.toLowerCase() === e);
  }, [customer, orders]);

  const liveSpend = useMemo(
    () => liveForCustomer.reduce((s, o) => s + o.total, 0),
    [liveForCustomer]
  );

  if (!open) return null;

  if (!customer) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl"
          showCloseButton
        >
          <SheetHeader>
            <SheetTitle>Customer</SheetTitle>
            <SheetDescription>
              Select a customer from the list.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const isRepeat = customer.tags.some((t) =>
    t.toLowerCase().includes("repeat")
  );

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
              <SheetTitle className="text-lg">{customer.name}</SheetTitle>
              <SheetDescription className="font-mono text-xs">
                {customer.email}
              </SheetDescription>
            </div>
            {isRepeat ? (
              <Badge variant="secondary">Repeat buyer</Badge>
            ) : (
              <Badge variant="outline">Account</Badge>
            )}
          </div>
          {customer.company ? (
            <p className="text-muted-foreground mt-2 text-sm">
              {customer.company}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1">
            {customer.tags.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="text-[10px] capitalize"
              >
                {t}
              </Badge>
            ))}
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 px-4 py-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Kpi
              label="Profile LTV"
              value={formatCurrency(customer.totalSpend)}
            />
            <Kpi label="Orders (profile)" value={String(customer.orderCount)} />
            <Kpi
              label="Live orders match"
              value={`${liveForCustomer.length} · ${formatCurrency(liveSpend)}`}
            />
            <Kpi
              label="Last activity"
              value={new Date(customer.lastSeen).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            />
          </div>

          <Separator />

          <section>
            <h3 className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
              <ShoppingBag className="size-3.5" aria-hidden />
              Purchase timeline
            </h3>
            {purchaseTimeline.length === 0 ? (
              <p className="text-muted-foreground text-sm">No purchases yet.</p>
            ) : (
              <ul className="space-y-3">
                {purchaseTimeline.map((row) => (
                  <li
                    key={`${row.reference}-${row.at}`}
                    className="border-primary/35 relative border-l-2 pl-4"
                  >
                    <div className="bg-primary absolute top-1.5 -left-[5px] size-2 rounded-full" />
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{row.reference}</span>
                      <span className="font-mono text-sm tabular-nums">
                        {formatCurrency(row.total)}
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                      <time dateTime={row.at}>
                        {new Date(row.at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                      <Badge
                        variant="outline"
                        className="h-5 text-[10px] capitalize"
                      >
                        {displayOrderStatus(row.status)}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Separator />

          <section>
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Order history (profile)
            </h3>
            <ul className="space-y-1.5 text-sm">
              {customer.orders.map((o) => (
                <li
                  key={o.reference}
                  className="border-border/60 bg-muted/20 flex justify-between gap-2 rounded-md border px-2 py-1.5"
                >
                  <span>{o.reference}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatCurrency(o.total)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <Separator />

          <section>
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Communication history
            </h3>
            {customer.communications.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No logged threads.
              </p>
            ) : (
              <ul className="space-y-2">
                {customer.communications.map((c) => (
                  <Card key={c.id} size="sm" className="border-border/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-muted-foreground text-xs font-medium uppercase">
                        {c.channel}
                      </span>
                      <Badge
                        variant={c.direction === "in" ? "secondary" : "outline"}
                      >
                        {c.direction === "in" ? "Inbound" : "Outbound"}
                      </Badge>
                    </div>
                    <p className="mt-1 leading-snug font-medium">{c.subject}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {c.snippet}
                    </p>
                    <p className="text-muted-foreground mt-2 text-[10px]">
                      {new Date(c.at).toLocaleString()}
                    </p>
                  </Card>
                ))}
              </ul>
            )}
          </section>

          <Separator />

          <section>
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              Customer activity
            </h3>
            {customer.activities.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No recent activity events.
              </p>
            ) : (
              <ul className="space-y-2">
                {customer.activities.map((a) => {
                  const Icon = activityIcon(a.kind);
                  return (
                    <li
                      key={a.id}
                      className="border-border/50 bg-card/60 flex gap-2 rounded-md border px-2 py-2 text-sm"
                    >
                      <Icon
                        className="text-muted-foreground mt-0.5 size-4 shrink-0"
                        aria-hidden
                      />
                      <div>
                        <p className="leading-snug font-medium">{a.label}</p>
                        {a.detail ? (
                          <p className="text-muted-foreground text-xs">
                            {a.detail}
                          </p>
                        ) : null}
                        <p className="text-muted-foreground mt-1 text-[10px]">
                          {new Date(a.at).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border/70 bg-muted/20 rounded-lg border px-2 py-2">
      <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}
