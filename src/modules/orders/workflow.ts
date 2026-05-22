import type { OrderStatus } from "./types";
import { ORDER_STATUS_FLOW } from "./types";

export function nextWorkflowStatus(current: OrderStatus): OrderStatus | null {
  if (
    current === "delivered" ||
    current === "disputed" ||
    current === "refunded"
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
  if (current === "pending" || current === "refunded") return null;
  const i = ORDER_STATUS_FLOW.indexOf(current);
  if (i <= 0) return null;
  return ORDER_STATUS_FLOW[i - 1] ?? null;
}

export function isTerminalStatus(s: OrderStatus) {
  return s === "delivered" || s === "disputed" || s === "refunded";
}

export function statusLabel(s: OrderStatus) {
  switch (s) {
    case "pending":
      return "Pending";
    case "paid":
      return "Paid";
    case "processing":
      return "Processing";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "disputed":
      return "Disputed";
    case "refunded":
      return "Refunded";
    default:
      return s;
  }
}
