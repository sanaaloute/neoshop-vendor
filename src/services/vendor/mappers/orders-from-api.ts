import type {
  OrderLine,
  OrderShipTo,
  OrderStatus,
  TimelineEvent,
  VendorOrder,
} from "@/modules/orders/types";

function money(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}

function iso(v: unknown): string {
  if (typeof v === "string" && v.length > 0) return v;
  return new Date().toISOString();
}

const API_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "disputed",
  "refunded",
];

function normalizeOrderStatus(raw: string): OrderStatus {
  return API_ORDER_STATUSES.includes(raw as OrderStatus)
    ? (raw as OrderStatus)
    : "pending";
}

function mapShipTo(raw: Record<string, unknown>): OrderShipTo {
  const addr = raw.shippingAddress as Record<string, unknown> | undefined;
  return {
    line1: String(addr?.line1 ?? addr?.street ?? raw.shipToLine1 ?? "—"),
    city: String(addr?.city ?? raw.shipToCity ?? "—"),
    postal: String(addr?.postalCode ?? addr?.postal ?? raw.shipToPostal ?? "—"),
    country: String(addr?.country ?? raw.shipToCountry ?? "—"),
  };
}

/** Map gateway order payload into the orders module `VendorOrder` view model. */
export function mapGatewayOrderToVendorOrder(
  raw: Record<string, unknown>
): VendorOrder {
  const items = Array.isArray(raw.items)
    ? (raw.items as Record<string, unknown>[])
    : [];
  const lines: OrderLine[] =
    items.length > 0
      ? items.map((it) => ({
          sku: String(
            it.sku ?? (it.variant as Record<string, unknown>)?.sku ?? "—"
          ),
          name: String(
            it.productName ?? it.name ?? (it.product as Record<string, unknown>)?.title ?? "Item"
          ),
          qty: Number(it.quantity ?? it.qty ?? 1),
          unitPrice: money(it.unitPrice ?? it.price),
        }))
      : [
          {
            sku: "—",
            name: "No line items in payload",
            qty: 1,
            unitPrice: 0,
          },
        ];

  const cust = raw.customer as Record<string, unknown> | undefined;

  return {
    id: String(raw.id),
    reference: String(
      raw.reference ?? raw.orderNumber ?? raw.humanId ?? raw.id
    ).slice(0, 48),
    customerEmail: String(cust?.email ?? ""),
    customerName: String(
      cust?.name ?? cust?.fullName ?? cust?.email ?? "Customer"
    ),
    status: normalizeOrderStatus(String(raw.status ?? "pending")),
    createdAt: iso(raw.placedAt ?? raw.createdAt),
    updatedAt: iso(raw.updatedAt ?? raw.placedAt ?? raw.createdAt),
    shipTo: mapShipTo(raw),
    lines,
    subtotal: money(raw.subtotal),
    shipping: money(raw.shippingTotal ?? raw.shippingCost ?? raw.shipping),
    tax: money(raw.taxTotal ?? raw.tax),
    total: money(raw.total ?? raw.grandTotal ?? raw.amount),
    timeline: [],
    shippingHistory: [],
  };
}

function timelineFromStatusHistory(raw: Record<string, unknown>): TimelineEvent[] {
  const hist = raw.statusHistory ?? raw.orderStatusHistory;
  if (!Array.isArray(hist) || hist.length === 0) return [];
  const rows = hist as Record<string, unknown>[];
  const events = rows.map((row, i) => {
    const at = iso(row.createdAt ?? row.at ?? row.updatedAt);
    const status = String(row.status ?? row.toStatus ?? "update");
    const note = row.note != null ? String(row.note) : undefined;
    return {
      id: `hist_${String(row.id ?? i)}_${at}`,
      at,
      kind: "status" as const,
      label: `Status · ${status}`,
      detail: note,
    };
  });
  /** Newest-first for the drawer (same as local pushTimeline). */
  return [...events].sort((a, b) => +new Date(b.at) - +new Date(a.at));
}

/** Prefer server status history when present (GET /orders/:orderId detail). */
export function mapGatewayOrderDetailToVendorOrder(
  raw: Record<string, unknown>
): VendorOrder {
  const base = mapGatewayOrderToVendorOrder(raw);
  const tl = timelineFromStatusHistory(raw);
  return {
    ...base,
    timeline: tl.length > 0 ? tl : base.timeline,
  };
}
