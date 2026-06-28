"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Eye, Save } from "lucide-react";

import { GatewaySyncBanner } from "@/components/feedback/gateway-sync-banner";
import { LoadingButton } from "@/components/feedback/loading-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getApiBaseUrl } from "@/config/auth";
import { useGatewayCatalogBootstrap } from "@/hooks/use-gateway-catalog-bootstrap";
import { useGatewayVariantsBootstrap } from "@/hooks/use-gateway-variants-bootstrap";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { slugify } from "@/lib/slugify";
import { useVariantsWrite } from "@/hooks/use-variants-write";
import { useVariants } from "@/hooks/use-variants";
import { useInventoryWrite } from "@/hooks/use-inventory-write";
import { useProductAttributes } from "@/hooks/use-product-attributes";
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
  const t = useTranslations("variants");
  const searchParams = useSearchParams();
  const urlProductId = searchParams.get("productId");

  const products = useProductCatalogStore((s) => s.products);
  const variants = useVariantWorkbenchStore((s) => s.variants);
  const attributes = useVariantWorkbenchStore((s) => s.attributes);
  const productImages = useVariantWorkbenchStore((s) => s.productImages);
  const resetWorkbench = useVariantWorkbenchStore((s) => s.resetWorkbench);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState<VariantRow[]>([]);
  const [previewTitle, setPreviewTitle] = useState(t("variantPreview"));
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const saveMessageTimerRef = useRef<number | undefined>(undefined);
  const lastUrlProductId = useRef<string | null>(null);

  const catalogSync = useGatewayCatalogBootstrap();
  const variantSync = useGatewayVariantsBootstrap(selectedProductId);
  const categories = useCategories();
  const { createBulk, updateBulk, remove, removeBulk } = useVariantsWrite();
  const { fetchVariants } = useVariants();
  const { setQuantity } = useInventoryWrite();
  const { createAttribute, createAttributeValues } = useProductAttributes();
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

    if (
      selectedProductId &&
      !products.some((p) => p.id === selectedProductId)
    ) {
      setSelectedProductId(null);
      setSelected(new Set());
      resetWorkbench();
    }
  }, [
    products,
    urlProductId,
    catalogSync.loading,
    selectedProductId,
    resetWorkbench,
  ]);

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
  }, [
    variantSync.loading,
    selectedProductId,
    attributes.length,
    products,
    categories,
  ]);

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
      await remove(selectedProductId, variantId);
    } catch (e) {
      setSaveMessage(httpErrorMessageForUser(e, t("couldNotDeleteVariant")));
      if (saveMessageTimerRef.current !== undefined) {
        window.clearTimeout(saveMessageTimerRef.current);
      }
      saveMessageTimerRef.current = window.setTimeout(
        () => setSaveMessage(null),
        5000
      );
    }
  };

  function isUuidV4(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id
    );
  }

  async function syncAttributesToBackend(
    productId: string,
    attributes: VariantAttributeDefinition[]
  ): Promise<{ oldId: string; attr: VariantAttributeDefinition }[]> {
    const syncOne = async (attr: VariantAttributeDefinition) => {
      const valueIdMap: Record<string, string> = { ...(attr.valueIdMap ?? {}) };
      let backendAttrId = attr.id;

      if (!attr.code) {
        try {
          const created = await createAttribute(productId, {
            code:
              slugify(attr.name) || `attr-${crypto.randomUUID().slice(0, 8)}`,
            label: attr.name,
          });
          const createdItem = Array.isArray(created)
            ? (created as unknown[])[0]
            : created;
          const extractedId = (
            createdItem as Record<string, unknown> | undefined
          )?.id;
          if (extractedId) {
            backendAttrId = String(extractedId);
          }
        } catch (e) {
          const ax = e as {
            response?: { data?: { message?: string | string[] } };
          };
          const m = ax.response?.data?.message;
          const backendMsg = (
            typeof m === "string" ? m : Array.isArray(m) ? m.join(", ") : ""
          ).toLowerCase();
          const errMsg = (
            backendMsg || (e instanceof Error ? e.message : String(e))
          ).toLowerCase();
          if (
            errMsg.includes("variants have been created") ||
            errMsg.includes("cannot define")
          ) {
            // Backend locked (variants already exist) or attribute already exists.
            // If the current id is a local generated id we do NOT have a valid
            // backend attribute id → we cannot create values. Fall back only
            // when the id already looks like a backend id.
            if (isUuidV4(attr.id)) {
              backendAttrId = attr.id;
            }
          } else if (errMsg.includes("attribute code must be unique")) {
            throw new Error(
              t("attributeCodeAlreadyExists", { name: attr.name })
            );
          } else {
            throw e;
          }
        }
      }

      // Batch-create all missing values for this attribute in a single call.
      if (isUuidV4(backendAttrId)) {
        const missingValues = attr.values.filter((v) => !valueIdMap[v]);
        if (missingValues.length > 0) {
          try {
            const created = await createAttributeValues(
              productId,
              backendAttrId,
              {
                values: missingValues.map((value) => ({ value })),
              }
            );
            const createdItems = Array.isArray(created) ? created : [created];
            for (const item of createdItems as Array<Record<string, unknown>>) {
              const id = item?.id;
              const value =
                typeof item?.value === "string" ? item.value : undefined;
              if (id) {
                if (value && missingValues.includes(value)) {
                  valueIdMap[value] = String(id);
                } else {
                  // Fallback: assign to the first missing value still without an id.
                  const next = missingValues.find((v) => !valueIdMap[v]);
                  if (next) valueIdMap[next] = String(id);
                }
              }
            }
          } catch (e) {
            const ax = e as {
              response?: { data?: { message?: string | string[] } };
            };
            const m = ax.response?.data?.message;
            const backendMsg = (
              typeof m === "string" ? m : Array.isArray(m) ? m.join(", ") : ""
            ).toLowerCase();
            const errMsg = (
              backendMsg || (e instanceof Error ? e.message : String(e))
            ).toLowerCase();
            if (
              !errMsg.includes("variants have been created") &&
              !errMsg.includes("cannot define")
            ) {
              throw e;
            }
            // Otherwise backend is locked or values already exist; leave ids blank.
          }
        }
      }

      return {
        oldId: attr.id,
        attr: {
          ...attr,
          id: backendAttrId,
          code: attr.code || slugify(attr.name),
          valueIdMap,
        },
      };
    };

    return Promise.all(attributes.map(syncOne));
  }

  const saveRows = async (
    rows: VariantRow[],
    options: { deleteOrphans?: boolean } = {}
  ) => {
    if (!getApiBaseUrl()) {
      setSaveMessage(t("marketplaceUnavailable"));
      return;
    }
    if (!selectedProductId) {
      setSaveMessage(t("chooseProductBeforeSaving"));
      return;
    }
    setSaveBusy(true);
    setSaveMessage(null);
    try {
      // 1. Sync attributes so every value has a backend id.
      const currentAttributes = useVariantWorkbenchStore.getState().attributes;
      const synced = await syncAttributesToBackend(
        selectedProductId,
        currentAttributes
      );
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
        throw new Error(t("attributeValuesNotResolved"));
      }

      // 3. Discover which backend variants are being replaced.
      // Only delete orphan backend variants when explicitly requested (Save All).
      // Save Selected must not touch unselected backend rows.
      let idsToDelete: string[] = [];
      if (options.deleteOrphans !== false) {
        const existingRaw = await fetchVariants(selectedProductId);
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
        const keptIds = new Set(
          validRows.filter((r) => !r.isLocalOnly).map((r) => r.id)
        );
        idsToDelete = [...existingIds].filter((id) => !keptIds.has(id));
      }

      // 4. Create / update variants in bulk.
      const toCreate = validRows.filter((r) => r.isLocalOnly);
      const toUpdate = validRows.filter((r) => !r.isLocalOnly);
      const createdMappings: { localId: string; backendId: string }[] = [];

      const product = products.find((p) => p.id === selectedProductId);
      const currency = product?.currency ?? "CNY";

      if (toCreate.length > 0) {
        const variants = toCreate.map((row) => {
          const weightKg =
            row.weightGrams > 0 ? row.weightGrams / 1000 : undefined;
          const volumeCbm =
            row.lengthCm > 0 && row.widthCm > 0 && row.heightCm > 0
              ? (row.lengthCm * row.widthCm * row.heightCm) / 1_000_000
              : undefined;
          return {
            wholesalePrice: row.price,
            currency,
            attributeValueIds: row.selectionIds ?? [],
            isActive: true,
            weightKg,
            volumeCbm,
            imageUrl: row.imageUrl,
          };
        });
        const created = await createBulk(selectedProductId, {
          variants,
        });
        const createdItems = Array.isArray(created)
          ? created
          : Array.isArray((created as Record<string, unknown>)?.items)
            ? ((created as Record<string, unknown>).items as unknown[])
            : [];
        for (let i = 0; i < toCreate.length; i++) {
          const item = createdItems[i] as Record<string, unknown> | undefined;
          const createdId = item?.id ? String(item.id) : undefined;
          if (createdId) {
            createdMappings.push({
              localId: toCreate[i].id,
              backendId: createdId,
            });
          }
        }
        // Promote immediately so retries don't accidentally delete them as orphans.
        for (const { localId, backendId } of createdMappings) {
          store.updateVariant(localId, { id: backendId, isLocalOnly: false });
        }
      }

      if (toUpdate.length > 0) {
        const updates = toUpdate.map((row) => {
          const weightKg =
            row.weightGrams > 0 ? row.weightGrams / 1000 : undefined;
          const volumeCbm =
            row.lengthCm > 0 && row.widthCm > 0 && row.heightCm > 0
              ? (row.lengthCm * row.widthCm * row.heightCm) / 1_000_000
              : undefined;
          return {
            variantId: row.id,
            wholesalePrice: row.price,
            currency,
            weightKg,
            volumeCbm,
            imageUrl: row.imageUrl,
          };
        });
        await updateBulk(selectedProductId, { updates });
      }

      // 5. Set inventory for all variants in parallel.
      const inventoryTasks: Promise<void>[] = [];
      for (const row of validRows) {
        const variantId = row.isLocalOnly
          ? createdMappings.find((m) => m.localId === row.id)?.backendId
          : row.id;
        if (variantId) {
          inventoryTasks.push(
            setQuantity(variantId, row.stock).then(() => undefined)
          );
        }
      }
      await Promise.all(inventoryTasks);

      // 7. Remove orphaned backend variants in bulk.
      if (idsToDelete.length > 0) {
        try {
          await removeBulk(selectedProductId, {
            variantIds: idsToDelete,
          });
        } catch {
          // Best-effort cleanup; fall back to single deletes.
          for (const id of idsToDelete) {
            try {
              await remove(selectedProductId, id);
            } catch {
              /* ignore */
            }
          }
        }
      }

      setSelected(new Set());
      let msg = t("variantsSaved", { count: validRows.length });
      if (skippedCount > 0) {
        msg += " " + t("rowsSkipped", { count: skippedCount });
      }
      setSaveMessage(msg);
      resetWorkbench();
    } catch (e) {
      setSaveMessage(httpErrorMessageForUser(e, t("couldNotSaveVariants")));
    } finally {
      setSaveBusy(false);
      if (saveMessageTimerRef.current !== undefined) {
        window.clearTimeout(saveMessageTimerRef.current);
      }
      saveMessageTimerRef.current = window.setTimeout(
        () => setSaveMessage(null),
        5000
      );
    }
  };

  const selectedRows = variants.filter((v) => selected.has(v.id));

  useEffect(() => {
    if (selectedProductId) {
      console.log("Variants:", variants);
    }
  }, [variants, selectedProductId]);

  return (
    <div className="flex flex-col gap-6">
      <GatewaySyncBanner
        loading={catalogSync.loading || variantSync.loading}
        error={catalogSync.error || variantSync.error}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1.5 sm:min-w-72">
          <Label htmlFor="variant-product">{t("title")}</Label>
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
            <option value="">{t("chooseProduct")}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {selectedProductId && (
            <div className="flex flex-wrap items-center gap-1">
              {(() => {
                const product = products.find(
                  (p) => p.id === selectedProductId
                );
                if (!product || product.categoryIds.length === 0) return null;
                return product.categoryIds.map((id) => {
                  const cat = categories.find((c) => c.id === id);
                  return cat ? (
                    <span
                      key={id}
                      className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                    >
                      {cat.name}
                    </span>
                  ) : null;
                });
              })()}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {saveMessage ? (
            <span className="text-muted-foreground text-xs">{saveMessage}</span>
          ) : null}
          <LoadingButton
            type="button"
            size="sm"
            loading={saveBusy}
            loadingText={t("saveSelected")}
            disabled={
              variantSync.loading || !selectedRows.length || !selectedProductId
            }
            onClick={() =>
              void saveRows(selectedRows, { deleteOrphans: false })
            }
          >
            <Save className="size-4" aria-hidden />
            {t("saveSelected")}
          </LoadingButton>
          <LoadingButton
            type="button"
            size="sm"
            variant="outline"
            loading={saveBusy}
            loadingText={t("saveAll")}
            disabled={
              variantSync.loading || !variants.length || !selectedProductId
            }
            onClick={() => void saveRows(variants)}
          >
            {t("saveAll")}
          </LoadingButton>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              saveBusy ||
              variantSync.loading ||
              !variants.length ||
              selected.size === 0
            }
            onClick={() =>
              openPreview(
                variants.filter((v) => selected.has(v.id)),
                t("selectedVariants")
              )
            }
          >
            <Eye className="size-4" aria-hidden />
            {t("previewSelected")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saveBusy || variantSync.loading || !variants.length}
            onClick={() => openPreview(variants, t("allVariants"))}
          >
            <Eye className="size-4" aria-hidden />
            {t("previewAll")}
          </Button>
        </div>
      </div>

      {variants.length > 0 && (
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
          <span className="text-foreground font-medium">
            {t("saved", {
              count: variants.filter((v) => !v.isLocalOnly).length,
            })}
          </span>
          {variants.some((v) => v.isLocalOnly) && (
            <>
              <span>·</span>
              <span className="font-medium text-amber-600">
                {t("new", {
                  count: variants.filter((v) => v.isLocalOnly).length,
                })}
              </span>
            </>
          )}
          {attributes.length > 0 && (
            <>
              <span>·</span>
              <span>{t("attributes", { count: attributes.length })}</span>
            </>
          )}
        </div>
      )}

      {productImages.length > 0 && (
        <div className="border-border/80 bg-card shadow-vendor-card rounded-xl border p-4">
          <h3 className="text-sm font-semibold tracking-tight">
            {t("productImages")}
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            {t("clickImageHint")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {productImages.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id}
                src={img.url}
                alt={img.fileName}
                className="border-border/60 h-16 w-16 rounded-md border object-cover"
              />
            ))}
          </div>
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
