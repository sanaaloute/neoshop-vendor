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
  unitPrice: number;
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
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
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
