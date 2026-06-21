/** Aligned with gateway `OrderStatus` (vendor-panel-api-endpoints.txt §11). */
export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "disputed"
  | "refunded"
  | "cancelled";

export type OrderLine = {
  sku: string;
  name: string;
  qty: number;
  unitPrice: string;
  /** Variant id from the gateway, when available, used for shipping-rate lookups. */
  variantId?: string;
};

export type TimelineEvent = {
  id: string;
  at: string;
  kind: "status" | "note" | "system" | "shipping";
  label: string;
  detail?: string;
};

export type ShippingUpdate = {
  id: string;
  at: string;
  carrier: string;
  trackingNumber: string;
  statusLabel: string;
};

export type OrderShipTo = {
  line1: string;
  city: string;
  postal: string;
  country: string;
};

export type VendorOrder = {
  id: string;
  reference: string;
  customerEmail: string;
  customerName: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  shipTo: OrderShipTo;
  lines: OrderLine[];
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  currency?: string;
  timeline: TimelineEvent[];
  shippingHistory: ShippingUpdate[];
};

/** Typical vendor fulfillment progression for bulk advance / workflow helpers. */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
];

/** Allowed vendor-initiated status transitions. The backend remains authoritative. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["processing", "cancelled", "refunded"],
  processing: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "cancelled", "refunded"],
  delivered: ["refunded"],
  disputed: ["refunded"],
  refunded: [],
  cancelled: [],
};
