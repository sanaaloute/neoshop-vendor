"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, Loader2, Save } from "lucide-react";

import { GatewaySyncBanner } from "@/components/feedback/gateway-sync-banner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getApiBaseUrl } from "@/config/auth";
import { useGatewayCatalogBootstrap } from "@/hooks/use-gateway-catalog-bootstrap";
import { useGatewayVariantsBootstrap } from "@/hooks/use-gateway-variants-bootstrap";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { setVariantQuantity } from "@/services/vendor/inventory-api";
import {
  createVariant,
  deleteVariant,
  updateVariant as updateVariantApi,
} from "@/services/vendor/variants-api";
import { useProductCatalogStore } from "@/store/product-catalog-store";
import { useVariantWorkbenchStore } from "@/store/variant-workbench-store";

import { VariantBulkBar } from "./variant-bulk-bar";
import { VariantMatrixPanel } from "./variant-matrix-panel";
import { VariantPreviewSheet } from "./variant-preview-sheet";
import type { VariantRow } from "./types";
import { VariantTable } from "./variant-table";

export function VariantsHome() {
  const searchParams = useSearchParams();
  const urlProductId = searchParams.get("productId");

  const products = useProductCatalogStore((s) => s.products);
  const variants = useVariantWorkbenchStore((s) => s.variants);
  const attributes = useVariantWorkbenchStore((s) => s.attributes);
  const resetWorkbench = useVariantWorkbenchStore((s) => s.resetWorkbench);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState<VariantRow[]>([]);
  const [previewTitle, setPreviewTitle] = useState("Variant preview");
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const saveMessageTimerRef = useRef<number | undefined>(undefined);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const lastUrlProductId = useRef<string | null>(null);

  const catalogSync = useGatewayCatalogBootstrap();
  const variantSync = useGatewayVariantsBootstrap(selectedProductId);

  /*
   * Validate selectedProductId against the loaded catalog.
   * - On first catalog load, honour ?productId= from the URL only if the
   *   product actually exists in /products/me.
   * - If the URL changes later, re-evaluate once.
   * - If the currently selected product disappears from the catalog,
   *   clear the workbench so we don't show stale rows or fire phantom
   *   detail requests.
   */
  useEffect(() => {
    if (catalogSync.loading) return;

    const urlChanged = urlProductId !== lastUrlProductId.current;
    if (urlChanged) {
      lastUrlProductId.current = urlProductId;
      if (urlProductId && products.some((p) => p.id === urlProductId)) {
        setSelectedProductId(urlProductId);
        return;
      }
    }

    if (selectedProductId && !products.some((p) => p.id === selectedProductId)) {
      setSelectedProductId(null);
      setSelected(new Set());
      resetWorkbench();
    }
  }, [products, urlProductId, catalogSync.loading, selectedProductId, resetWorkbench]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === variants.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(variants.map((v) => v.id)));
    }
  };

  const openPreview = (rows: VariantRow[], title: string) => {
    setPreviewRows(rows);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  const handleDeleteVariant = async (variantId: string) => {
    const row = variants.find((v) => v.id === variantId);
    if (!row) return;

    useVariantWorkbenchStore.getState().removeVariant(variantId);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(variantId);
      return next;
    });

    if (!getApiBaseUrl()) return;
    if (row.isLocalOnly) return;
    if (!selectedProductId) return;

    setDeleteBusy(true);
    setSaveMessage(null);
    try {
      await deleteVariant(selectedProductId, variantId);
    } catch (e) {
      setSaveMessage(
        httpErrorMessageForUser(e, "Could not delete variant. Try again.")
      );
      if (saveMessageTimerRef.current !== undefined) {
        window.clearTimeout(saveMessageTimerRef.current);
      }
      saveMessageTimerRef.current = window.setTimeout(
        () => setSaveMessage(null),
        5000
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  const saveRows = async (rows: VariantRow[]) => {
    if (!getApiBaseUrl()) {
      setSaveMessage("Marketplace connection is not available.");
      return;
    }
    if (!selectedProductId) {
      setSaveMessage("Choose a product before saving variants.");
      return;
    }
    setSaveBusy(true);
    setSaveMessage(null);
    try {
      for (const row of rows) {
        if (row.isLocalOnly) {
          const created = await createVariant(selectedProductId, {
            wholesalePrice: row.price,
            moq: row.moq,
            attributeValueIds: row.selectionIds ?? [],
            isActive: true,
          });
          const createdId = String(
            (created as Record<string, unknown>).id
          );
          await setVariantQuantity(createdId, { quantity: row.stock });
          useVariantWorkbenchStore
            .getState()
            .updateVariant(row.id, { id: createdId, isLocalOnly: false });
        } else {
          await updateVariantApi(selectedProductId, row.id, {
            wholesalePrice: row.price,
            moq: row.moq,
          });
          await setVariantQuantity(row.id, { quantity: row.stock });
        }
      }
      setSelected(new Set());
      setSaveMessage(
        `${rows.length} variant${rows.length === 1 ? "" : "s"} saved.`
      );
      resetWorkbench();
    } catch (e) {
      setSaveMessage(
        httpErrorMessageForUser(e, "Could not save variants. Try again.")
      );
    } finally {
      setSaveBusy(false);
      if (saveMessageTimerRef.current !== undefined) {
        window.clearTimeout(saveMessageTimerRef.current);
      }
      saveMessageTimerRef.current = window.setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const selectedRows = variants.filter((v) => selected.has(v.id));

  return (
    <div className="flex flex-col gap-6">
      <GatewaySyncBanner
        loading={catalogSync.loading || variantSync.loading}
        error={catalogSync.error || variantSync.error}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1.5 sm:min-w-72">
          <Label htmlFor="variant-product">Product</Label>
          <select
            id="variant-product"
            className="border-input bg-background h-9 rounded-lg border px-3 text-sm"
            value={selectedProductId ?? ""}
            onChange={(e) => {
              const next = e.target.value || null;
              setSelectedProductId(next);
              setSelected(new Set());
              resetWorkbench();
            }}
          >
            <option value="">Choose a product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {saveMessage ? (
            <span className="text-muted-foreground text-xs">{saveMessage}</span>
          ) : null}
          <Button
            type="button"
            size="sm"
            disabled={
              saveBusy ||
              variantSync.loading ||
              !selectedRows.length ||
              !selectedProductId
            }
            onClick={() => void saveRows(selectedRows)}
          >
            {saveBusy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Save className="size-4" aria-hidden />
            )}
            Save selected
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={
              saveBusy ||
              variantSync.loading ||
              !variants.length ||
              !selectedProductId
            }
            onClick={() => void saveRows(variants)}
          >
            Save all
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!variants.length || selected.size === 0}
            onClick={() =>
              openPreview(
                variants.filter((v) => selected.has(v.id)),
                "Selected variants"
              )
            }
          >
            <Eye className="size-4" aria-hidden />
            Preview selected
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!variants.length}
            onClick={() => openPreview(variants, "All variants")}
          >
            <Eye className="size-4" aria-hidden />
            Preview all
          </Button>
        </div>
      </div>

      <VariantMatrixPanel />

      <VariantBulkBar
        selected={selected}
        onClearSelection={() => setSelected(new Set())}
      />

      <VariantTable
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
        onDelete={handleDeleteVariant}
      />

      <VariantPreviewSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={previewTitle}
        attributes={attributes}
        rows={previewRows}
      />
    </div>
  );
}
