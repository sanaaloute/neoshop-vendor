import type {
  OrderLine,
  OrderShipTo,
  OrderStatus,
  TimelineEvent,
  VendorOrder,
} from "@/modules/orders/types";

function money(v: unknown): string {
  if (typeof v === "string" && v.length > 0) return v;
  if (typeof v === "number" && !Number.isNaN(v)) return v.toFixed(2);
  return "0";
}

function iso(v: unknown): string {
  if (typeof v === "string" && v.length > 0) return v;
  return new Date().toISOString();
}

const API_ORDER_STATUSES: OrderStatus[] = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "disputed",
  "refunded",
  "cancelled",
];

function normalizeOrderStatus(raw: string): OrderStatus {
  return API_ORDER_STATUSES.includes(raw as OrderStatus)
    ? (raw as OrderStatus)
    : "pending_payment";
}

function mapShipTo(raw: Record<string, unknown> | undefined): OrderShipTo {
  if (!raw) {
    return { line1: "—", city: "—", postal: "—", country: "—" };
  }
  return {
    line1: String(raw.streetLine1 ?? "—"),
    city: String(raw.city ?? "—"),
    postal: String(raw.postalCode ?? "—"),
    country: String(raw.country ?? "—"),
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
            it.productName ??
              it.name ??
              (it.product as Record<string, unknown>)?.title ??
              "Item"
          ),
          qty: Number(it.quantity ?? it.qty ?? 1),
          unitPrice: money(it.unitPrice ?? it.price),
          variantId:
            String(
              it.variantId ?? (it.variant as Record<string, unknown>)?.id ?? ""
            ) || undefined,
        }))
      : [
          {
            sku: "—",
            name: "No line items in payload",
            qty: 1,
            unitPrice: "0",
          },
        ];

  const cust = raw.customer as Record<string, unknown> | undefined;
  // Vendor order endpoints only expose the customer email, not name/address.
  const customerEmail = String(cust?.email ?? raw.customerEmail ?? "");

  const shippingAddress = raw.shippingAddress as
    | Record<string, unknown>
    | undefined;
  const shippingMethod = raw.shippingMethod as
    | Record<string, unknown>
    | undefined;

  return {
    id: String(raw.id),
    orderNumber: String(raw.orderNumber ?? raw.humanId ?? raw.id).slice(0, 48),
    reference: String(
      raw.orderNumber ?? raw.reference ?? raw.humanId ?? raw.id
    ).slice(0, 48),
    customerEmail,
    customerName: customerEmail || "Customer",
    status: normalizeOrderStatus(String(raw.status ?? "pending_payment")),
    createdAt: iso(raw.placedAt ?? raw.createdAt),
    updatedAt: iso(raw.updatedAt ?? raw.placedAt ?? raw.createdAt),
    shipTo: mapShipTo(shippingAddress),
    // Vendor payloads expose statusHistory but no detailed invoices/payments/refunds.
    // The mapper keeps those fields off the VendorOrder view model.
    lines,
    subtotal: money(raw.subtotal),
    shipping: money(raw.shippingTotal ?? raw.shippingCost ?? raw.shipping),
    tax: money(raw.taxTotal ?? raw.tax),
    total: money(raw.total ?? raw.grandTotal ?? raw.amount),
    currency: raw.currency ? String(raw.currency) : undefined,
    shippingAddress: shippingAddress
      ? {
          fullName: String(shippingAddress.fullName ?? ""),
          phone: String(shippingAddress.phone ?? ""),
          country: String(shippingAddress.country ?? ""),
          city: String(shippingAddress.city ?? ""),
          region: String(shippingAddress.region ?? ""),
          postalCode: String(shippingAddress.postalCode ?? ""),
          streetLine1: String(shippingAddress.streetLine1 ?? ""),
          streetLine2:
            shippingAddress.streetLine2 != null
              ? String(shippingAddress.streetLine2)
              : null,
        }
      : null,
    shippingMethod: shippingMethod
      ? {
          name: String(shippingMethod.name ?? ""),
          type: shippingMethod.type === "SEA" ? "SEA" : "AIR",
          estimatedDaysMin: Number(shippingMethod.estimatedDaysMin ?? 0),
          estimatedDaysMax: Number(shippingMethod.estimatedDaysMax ?? 0),
        }
      : null,
    trackingNumber:
      raw.trackingNumber != null ? String(raw.trackingNumber) : undefined,
    timeline: [],
    shippingHistory: [],
  };
}

function timelineFromStatusHistory(
  raw: Record<string, unknown>
): TimelineEvent[] {
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
