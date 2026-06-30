/** Aligned with gateway `OrderStatus` (vendor-panel-api-endpoints.txt §11). */
export type OrderStatus =
  | "pending_payment"
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
  orderNumber: string;
  reference: string;
  customerEmail: string;
  customerName: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  shipTo: OrderShipTo;
  shippingAddress?: {
    fullName: string;
    phone: string;
    country: string;
    city: string;
    region: string;
    postalCode: string;
    streetLine1: string;
    streetLine2?: string | null;
  } | null;
  shippingMethod?: {
    name: string;
    type: "SEA" | "AIR";
    estimatedDaysMin: number;
    estimatedDaysMax: number;
  } | null;
  lines: OrderLine[];
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  currency?: string;
  trackingNumber?: string | null;
  timeline: TimelineEvent[];
  shippingHistory: ShippingUpdate[];
};

/** Typical vendor fulfillment progression for bulk advance / workflow helpers. */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
];

/** Allowed vendor-initiated status transitions per the vendor API guide.
 *  The backend remains authoritative. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: [],
  paid: ["processing"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  disputed: [],
  refunded: [],
  cancelled: [],
};
