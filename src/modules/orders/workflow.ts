import type { OrderStatus } from "./types";
import { ORDER_STATUS_FLOW } from "./types";

export function nextWorkflowStatus(current: OrderStatus): OrderStatus | null {
  if (
    current === "delivered" ||
    current === "disputed" ||
    current === "refunded" ||
    current === "cancelled"
  ) {
    return null;
  }
  const i = ORDER_STATUS_FLOW.indexOf(current);
  if (i < 0 || i >= ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[i + 1] ?? null;
}

export function previousWorkflowStatus(
  current: OrderStatus
): OrderStatus | null {
  if (current === "pending" || current === "refunded" || current === "cancelled")
    return null;
  const i = ORDER_STATUS_FLOW.indexOf(current);
  if (i <= 0) return null;
  return ORDER_STATUS_FLOW[i - 1] ?? null;
}

export function isTerminalStatus(s: OrderStatus) {
  return s === "delivered" || s === "disputed" || s === "refunded" || s === "cancelled";
}

export function statusLabel(s: OrderStatus): string {
  switch (s) {
    case "pending":
      return "status.pending";
    case "paid":
      return "status.paid";
    case "processing":
      return "status.processing";
    case "shipped":
      return "status.shipped";
    case "delivered":
      return "status.delivered";
    case "disputed":
      return "status.disputed";
    case "refunded":
      return "status.refunded";
    case "cancelled":
      return "status.cancelled";
    default:
      return s;
  }
}
