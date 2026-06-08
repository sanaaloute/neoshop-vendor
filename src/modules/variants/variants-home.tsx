"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, Loader2, Save } from "lucide-react";

import { GatewaySyncBanner } from "@/components/feedback/gateway-sync-banner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getApiBaseUrl } from "@/config/auth";
import { useGatewayCatalogBootstrap } from "@/hooks/use-gateway-catalog-bootstrap";
import { useGatewayVariantsBootstrap } from "@/hooks/use-gateway-variants-bootstrap";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { slugify } from "@/lib/slugify";
import { setVariantQuantity } from "@/services/vendor/inventory-api";
import {
  createProductAttribute,
  createProductAttributeValue,
} from "@/services/vendor/products-api";
import {
  createVariant,
  deleteVariant,
  listVariants,
  updateVariant as updateVariantApi,
} from "@/services/vendor/variants-api";
import { useCategories } from "@/hooks/use-categories";
import { useProductCatalogStore } from "@/store/product-catalog-store";
import { useVariantWorkbenchStore } from "@/store/variant-workbench-store";

import { resolvePresetAttributes } from "./category-attribute-presets";
import { VariantBulkBar } from "./variant-bulk-bar";
import { VariantMatrixPanel } from "./variant-matrix-panel";
import { VariantPreviewSheet } from "./variant-preview-sheet";
import type { VariantAttributeDefinition, VariantRow } from "./types";
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
  const lastUrlProductId = useRef<string | null>(null);
  const filesByVariantId = useRef(new Map<string, File>());
  const blobUrls = useRef(new Set<string>());

  const catalogSync = useGatewayCatalogBootstrap();
  const variantSync = useGatewayVariantsBootstrap(selectedProductId);
  const categories = useCategories();
  const presetInjectedFor = useRef(new Set<string>());

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

  // Reset preset tracker whenever the selected product changes.
  useEffect(() => {
    if (selectedProductId) {
      presetInjectedFor.current.clear();
    }
  }, [selectedProductId]);

  // Inject category-based default attributes when a product has no backend
  // attributes after the detail load finishes.  Vendors can still edit / add /
  // remove them freely.
  useEffect(() => {
    if (variantSync.loading || !selectedProductId) return;
    if (attributes.length > 0) return;
    if (presetInjectedFor.current.has(selectedProductId)) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product || product.categoryIds.length === 0) return;

    const categoryNames = product.categoryIds.map(
      (id) => categories.find((c) => c.id === id)?.name ?? id
    );
    const presets = resolvePresetAttributes(categoryNames);
    if (presets.length === 0) return;

    presetInjectedFor.current.add(selectedProductId);
    const store = useVariantWorkbenchStore.getState();
    for (const attr of presets) {
      const addedId = store.addAttribute(attr.name, attr.kind);
      for (const value of attr.values) {
        store.addValueToAttribute(addedId, value);
      }
    }
  }, [variantSync.loading, selectedProductId, attributes.length, products, categories]);

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
    }
  };

  const handleImageChange = useCallback(
    (variantId: string, file: File) => {
      const url = URL.createObjectURL(file);
      blobUrls.current.add(url);
      filesByVariantId.current.set(variantId, file);
      useVariantWorkbenchStore
        .getState()
        .updateVariant(variantId, { imageUrl: url });
    },
    []
  );

  function isLocalAttrId(id: string): boolean {
    return id.startsWith("attr_") && id.length > 5;
  }

  async function syncAttributesToBackend(
    productId: string,
    attributes: VariantAttributeDefinition[]
  ): Promise<{ oldId: string; attr: VariantAttributeDefinition }[]> {
    const result: { oldId: string; attr: VariantAttributeDefinition }[] = [];
    for (const attr of attributes) {
      const valueIdMap: Record<string, string> = { ...(attr.valueIdMap ?? {}) };
      const allValuesHaveIds = attr.values.every((v) => valueIdMap[v]);
      if (allValuesHaveIds) {
        result.push({ oldId: attr.id, attr });
        continue;
      }

      let backendAttrId = attr.id;
      if (!attr.code) {
        try {
          const created = await createProductAttribute(productId, {
            code: slugify(attr.name) || `attr-${crypto.randomUUID().slice(0, 8)}`,
            label: attr.name,
          });
          const createdItem = Array.isArray(created) ? (created as unknown[])[0] : created;
          const extractedId = (createdItem as Record<string, unknown> | undefined)?.id;
          if (extractedId) {
            backendAttrId = String(extractedId);
          }
        } catch (e) {
          const ax = e as { response?: { data?: { message?: string | string[] } } };
          const m = ax.response?.data?.message;
          const backendMsg = (typeof m === "string" ? m : Array.isArray(m) ? m.join(", ") : "").toLowerCase();
          const errMsg = (backendMsg || (e instanceof Error ? e.message : String(e))).toLowerCase();
          if (
            errMsg.includes("variants have been created") ||
            errMsg.includes("cannot define")
          ) {
            // Backend locked (variants already exist) or attribute already exists.
            // If the current id is a local generated id we do NOT have a valid
            // backend attribute id → we cannot create values. Fall back only
            // when the id already looks like a backend id.
            if (!isLocalAttrId(attr.id)) {
              backendAttrId = attr.id;
            }
          } else {
            throw e;
          }
        }
      }

      // Only attempt to create values when we are sure backendAttrId is a
      // real backend identifier (not a local attr_… id).
      if (!isLocalAttrId(backendAttrId)) {
        for (const value of attr.values) {
          if (valueIdMap[value]) continue;
          try {
            const created = await createProductAttributeValue(productId, backendAttrId, { values: [{ value }] });
            const createdItems = Array.isArray(created) ? created : [created];
            const firstItem = createdItems[0] as Record<string, unknown> | undefined;
            if (firstItem?.id) {
              valueIdMap[value] = String(firstItem.id);
            }
          } catch (e) {
            const ax = e as { response?: { data?: { message?: string | string[] } } };
            const m = ax.response?.data?.message;
            const backendMsg = (typeof m === "string" ? m : Array.isArray(m) ? m.join(", ") : "").toLowerCase();
            const errMsg = (backendMsg || (e instanceof Error ? e.message : String(e))).toLowerCase();
            if (
              errMsg.includes("variants have been created") ||
              errMsg.includes("cannot define")
            ) {
              // Value likely already exists or backend locked; skip it.
              continue;
            } else {
              throw e;
            }
          }
        }
      }

      result.push({
        oldId: attr.id,
        attr: { ...attr, id: backendAttrId, code: attr.code || slugify(attr.name), valueIdMap },
      });
    }
    return result;
  }

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
      // 1. Sync attributes so every value has a backend id.
      const currentAttributes = useVariantWorkbenchStore.getState().attributes;
      const synced = await syncAttributesToBackend(selectedProductId, currentAttributes);
      const store = useVariantWorkbenchStore.getState();
      for (const { oldId, attr } of synced) {
        if (oldId !== attr.id) {
          store.remapAttributeId(oldId, attr.id);
        }
        store.setAttributeValueIdMap(attr.id, attr.valueIdMap ?? {});
      }

      // 2. Rebuild rows with correct selectionIds.
      const finalAttributes = useVariantWorkbenchStore.getState().attributes;
      const rowsToSave = rows.map((row) => {
        if (row.selectionIds && row.selectionIds.length > 0) return row;
        const selectionIds: string[] = [];
        for (const [attrId, value] of Object.entries(row.combo)) {
          const attr = finalAttributes.find((a) => a.id === attrId);
          const valueId = attr?.valueIdMap?.[value];
          if (valueId) selectionIds.push(valueId);
        }
        return { ...row, selectionIds };
      });

      // 2b. Filter out rows that still have no selection ids — they cannot be
      // created on the backend. Warn the user so they know something is off.
      const validRows = rowsToSave.filter(
        (r) => Array.isArray(r.selectionIds) && r.selectionIds.length > 0
      );
      const skippedCount = rowsToSave.length - validRows.length;
      if (validRows.length === 0 && rowsToSave.length > 0) {
        throw new Error(
          "No variants could be saved because the attribute values could not be resolved. Please refresh the page and try again."
        );
      }

      // 3. Discover which backend variants are being replaced.
      const existingRaw = await listVariants(selectedProductId);
      const existingVariants = Array.isArray(existingRaw)
        ? existingRaw
        : Array.isArray((existingRaw as Record<string, unknown>)?.items)
          ? ((existingRaw as Record<string, unknown>).items as unknown[])
          : [];
      const existingIds = new Set(
        existingVariants
          .map((v) => (v as Record<string, unknown>).id)
          .filter((id): id is string => typeof id === "string")
      );
      const keptIds = new Set(validRows.filter((r) => !r.isLocalOnly).map((r) => r.id));
      const idsToDelete = [...existingIds].filter((id) => !keptIds.has(id));

      // 4. Create / update variants.
      const createdMappings: { localId: string; backendId: string }[] = [];
      for (const row of validRows) {
        const weightKg = row.weightGrams > 0 ? row.weightGrams / 1000 : undefined;
        const volumeCbm =
          row.lengthCm > 0 && row.widthCm > 0 && row.heightCm > 0
            ? (row.lengthCm * row.widthCm * row.heightCm) / 1_000_000
            : undefined;

        if (row.isLocalOnly) {
          const created = await createVariant(selectedProductId, {
            wholesalePrice: row.price,
            moq: row.moq,
            attributeValueIds: row.selectionIds ?? [],
            isActive: true,
            weightKg,
            volumeCbm,
          });
          const createdItem = Array.isArray(created) ? (created as unknown[])[0] : created;
          const createdId = String((createdItem as Record<string, unknown> | undefined)?.id);
          await setVariantQuantity(createdId, { quantity: row.stock });
          createdMappings.push({ localId: row.id, backendId: createdId });
        } else {
          await updateVariantApi(selectedProductId, row.id, {
            wholesalePrice: row.price,
            moq: row.moq,
            weightKg,
            volumeCbm,
          });
          await setVariantQuantity(row.id, { quantity: row.stock });
        }
      }

      // 5. Promote local rows to persisted.
      for (const { localId, backendId } of createdMappings) {
        store.updateVariant(localId, { id: backendId, isLocalOnly: false });
      }

      // 6. Remove orphaned backend variants.
      for (const id of idsToDelete) {
        try {
          await deleteVariant(selectedProductId, id);
        } catch {
          // Best-effort cleanup.
        }
      }

      setSelected(new Set());
      let msg = `${validRows.length} variant${validRows.length === 1 ? "" : "s"} saved.`;
      if (skippedCount > 0) {
        msg += ` ${skippedCount} row${skippedCount === 1 ? "" : "s"} skipped because attribute values could not be synced.`;
      }
      setSaveMessage(msg);
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

      {variants.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {variants.filter((v) => !v.isLocalOnly).length} saved
          </span>
          {variants.some((v) => v.isLocalOnly) && (
            <>
              <span>·</span>
              <span className="font-medium text-amber-600">
                {variants.filter((v) => v.isLocalOnly).length} new
              </span>
            </>
          )}
          {attributes.length > 0 && (
            <>
              <span>·</span>
              <span>{attributes.length} attribute{attributes.length === 1 ? "" : "s"}</span>
            </>
          )}
        </div>
      )}

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
        onImageChange={handleImageChange}
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
