import type {
  InventoryLine,
  StockMovement,
  Warehouse,
} from "@/modules/inventory/types";

const DEFAULT_WAREHOUSE: Warehouse = {
  id: "gateway",
  code: "GW",
  name: "Gateway inventory",
  region: "Variant-level stock",
};

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

export function mapApiProductDetailsToInventory(
  products: Record<string, unknown>[]
): {
  warehouses: Warehouse[];
  lines: InventoryLine[];
  movements: StockMovement[];
} {
  const lines: InventoryLine[] = [];

  for (const product of products) {
    const productName = str(product.title, str(product.name, "Product"));
    const variants = Array.isArray(product.variants) ? product.variants : [];
    for (const rawVariant of variants) {
      const variant = rawVariant as Record<string, unknown>;
      const inventory = (variant.inventory ?? {}) as Record<string, unknown>;
      const quantity = Math.max(0, Math.round(num(inventory.quantity, 0)));
      const reserved = Math.max(
        0,
        Math.round(num(inventory.reservedQuantity, 0))
      );
      lines.push({
        id: str(variant.id, `${str(product.id, "product")}-${lines.length}`),
        sku: str(variant.sku, "SKU"),
        productName,
        warehouseId: DEFAULT_WAREHOUSE.id,
        onHand: quantity,
        reserved,
        reorderPoint: Math.max(5, Math.ceil((quantity + reserved) * 0.2)),
      });
    }
  }

  return {
    warehouses: [DEFAULT_WAREHOUSE],
    lines,
    movements: [],
  };
}
