export type Warehouse = {
  id: string;
  code: string;
  name: string;
  region: string;
};

export type StockMovementType =
  | "receipt"
  | "shipment"
  | "adjustment"
  | "transfer_in"
  | "transfer_out";

export type StockMovement = {
  id: string;
  at: string;
  type: StockMovementType;
  sku: string;
  productName: string;
  warehouseId: string;
  /** Positive = stock in, negative = stock out */
  delta: number;
  balanceAfter: number;
  note?: string;
};

export type InventoryLine = {
  id: string;
  sku: string;
  productName: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  reorderPoint: number;
};

export function availableToPromise(line: InventoryLine) {
  return Math.max(0, line.onHand - line.reserved);
}

export function isLowStock(line: InventoryLine) {
  return line.onHand <= line.reorderPoint;
}

export function severityForLine(
  line: InventoryLine
): "critical" | "low" | "ok" {
  if (line.onHand <= Math.max(0, line.reorderPoint - 10)) return "critical";
  if (isLowStock(line)) return "low";
  return "ok";
}
