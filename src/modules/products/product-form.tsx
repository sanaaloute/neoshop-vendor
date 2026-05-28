"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";

import { VendorTextField } from "@/components/forms/vendor-text-field";
import { VendorWriteGuardBanner } from "@/components/vendor/vendor-write-guard-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";
import { getApiBaseUrl } from "@/config/auth";
import { UI_DELAYS } from "@/config/ui";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { slugify } from "@/lib/slugify";
import { mapApiProductRowToProduct } from "@/services/vendor/mappers/catalog-from-api";
import {
  createProductFromForm,
  updateProductFromForm,
} from "@/services/vendor/product-gateway-sync";
import { attachProductMedia, deleteProductMedia, getProduct } from "@/services/vendor/products-api";
import { uploadStorageObject } from "@/services/vendor/storage-api";
import { useVendorWritesAllowed } from "@/hooks/use-vendor-writes";
import { useProductCatalogStore } from "@/store/product-catalog-store";
import { useProductEditorDraftStore } from "@/store/product-editor-draft-store";

import { SUGGESTED_PRODUCT_TAGS } from "./constants";
import { useCategories } from "@/hooks/use-categories";
import { ProductMediaGallery } from "./product-media-gallery";
import { productFormSchema } from "./schemas";
import type { ProductFormValues } from "./types";

type ProductFormProps = {
  editorKey: string;
  catalogProductId: string | null;
  defaultValues: ProductFormValues;
  onSuccess?: () => void;
  onValuesSnapshot?: (values: ProductFormValues) => void;
};

export function ProductForm({
  editorKey,
  catalogProductId,
  defaultValues,
  onSuccess,
  onValuesSnapshot,
}: ProductFormProps) {
  const { canWriteCatalog, status: vendorStatus } = useVendorWritesAllowed();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const updateProduct = useProductCatalogStore((s) => s.updateProduct);
  const addProduct = useProductCatalogStore((s) => s.addProduct);
  const upsertProduct = useProductCatalogStore((s) => s.upsertProduct);
  const setDraft = useProductEditorDraftStore((s) => s.setDraft);
  const clearDraft = useProductEditorDraftStore((s) => s.clearDraft);

  const filesByMediaId = useRef(new Map<string, File>());
  const removedMediaIds = useRef(new Set<string>());
  const originalMediaIds = useRef(new Set<string>());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    originalMediaIds.current = new Set(
      (defaultValues.media ?? []).map((m) => m.id)
    );
  }, [catalogProductId]);

  const watched = useWatch({ control: form.control });
  const values = useMemo(
    () => (watched as ProductFormValues | undefined) ?? form.getValues(),
    [watched, form]
  );

  const autosaveTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (autosaveTimer.current !== undefined) {
      window.clearTimeout(autosaveTimer.current);
    }
    autosaveTimer.current = window.setTimeout(() => {
      setDraft(editorKey, values);
      onValuesSnapshot?.(values);
      const parsed = productFormSchema.safeParse(values);
      if (parsed.success && catalogProductId) {
        updateProduct(catalogProductId, parsed.data);
      }
    }, UI_DELAYS.PRODUCT_AUTOSAVE_DEBOUNCE);
    return () => {
      if (autosaveTimer.current !== undefined) {
        window.clearTimeout(autosaveTimer.current);
      }
    };
  }, [
    values,
    editorKey,
    setDraft,
    catalogProductId,
    updateProduct,
    onValuesSnapshot,
  ]);

  const [previews, setPreviews] = useState<Record<string, string>>({});
  const blobUrls = useRef(new Set<string>());

  useEffect(() => {
    const urls = blobUrls.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      urls.clear();
    };
  }, []);

  const mediaList = useWatch({ control: form.control, name: "media" }) ?? [];
  const watchedName = useWatch({ control: form.control, name: "name" });

  useEffect(() => {
    if (!watchedName?.trim()) return;
    const currentSku = form.getValues("sku");
    const base = slugify(watchedName).toUpperCase();
    const shortId = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    const generated = `${base}-${shortId}`;
    if (!currentSku || currentSku.startsWith(slugify(watchedName.slice(0, -1) || watchedName).toUpperCase())) {
      form.setValue("sku", generated, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [watchedName, form]);

  useEffect(() => {
    if (!watchedName?.trim()) return;
    const currentSlug = form.getValues("seo.slug");
    const generated = slugify(watchedName);
    if (!currentSlug || currentSlug === slugify(watchedName.slice(0, -1) || watchedName)) {
      form.setValue("seo.slug", generated, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [watchedName, form]);

  const handleAddFiles = useCallback(
    (files: File[]) => {
      if (!canWriteCatalog) return;
      const current = form.getValues("media") ?? [];
      const sorted = [...current].sort((a, b) => a.sortIndex - b.sortIndex);
      const next = [...sorted];
      files.forEach((f) => {
        const id = `m_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
        const url = URL.createObjectURL(f);
        blobUrls.current.add(url);
        setPreviews((p) => ({ ...p, [id]: url }));
        filesByMediaId.current.set(id, f);
        next.push({ id, fileName: f.name, sortIndex: next.length });
      });
      form.setValue(
        "media",
        next.map((m, i) => ({ ...m, sortIndex: i })),
        { shouldDirty: true, shouldValidate: true }
      );
    },
    [form, canWriteCatalog]
  );

  const handleRemoveMedia = useCallback(
    (id: string) => {
      if (!canWriteCatalog) return;
      const url = previews[id];
      if (url?.startsWith("blob:")) {
        URL.revokeObjectURL(url);
        blobUrls.current.delete(url);
      }
      filesByMediaId.current.delete(id);
      if (originalMediaIds.current.has(id)) {
        removedMediaIds.current.add(id);
      }
      setPreviews((p) => {
        const n = { ...p };
        delete n[id];
        return n;
      });
      const rest = form
        .getValues("media")
        .filter((m) => m.id !== id)
        .map((m, i) => ({ ...m, sortIndex: i }));
      form.setValue("media", rest, { shouldDirty: true, shouldValidate: true });
    },
    [form, previews, canWriteCatalog]
  );

  const [tagDraft, setTagDraft] = useState("");

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const initSnapshot = useRef(false);
  useEffect(() => {
    if (!onValuesSnapshot || initSnapshot.current) return;
    initSnapshot.current = true;
    queueMicrotask(() => {
      onValuesSnapshot(form.getValues());
    });
  }, [form, onValuesSnapshot]);

  const syncPendingMedia = async (
    productId: string,
    media: ProductFormValues["media"]
  ) => {
    for (const m of media) {
      const file = filesByMediaId.current.get(m.id);
      if (!file) continue;
      const up = await uploadStorageObject({
        file,
        bucket: "product-media",
        entityId: productId,
        type: `img_${m.sortIndex}`,
      });
      const url = up.publicUrl;
      if (!url) continue;
      await attachProductMedia(productId, {
        url,
        sortOrder: m.sortIndex,
        isPrimary: m.sortIndex === 0,
      });
      filesByMediaId.current.delete(m.id);
    }
    for (const mediaId of removedMediaIds.current) {
      try {
        await deleteProductMedia(productId, mediaId);
      } catch (e) {
        console.warn("Failed to delete product media", mediaId, e);
      }
    }
    removedMediaIds.current.clear();
    const refreshed = await getProduct(productId);
    upsertProduct(
      mapApiProductRowToProduct(refreshed as Record<string, unknown>)
    );
  };

  const saveToCatalog = form.handleSubmit(async (v) => {
    setSaveError(null);
    if (!canWriteCatalog) {
      setSaveError("Catalog changes unlock after NeoShop approves your vendor account.");
      return;
    }
    if (getApiBaseUrl()) {
      setSaving(true);
      try {
        if (catalogProductId) {
          const p = await updateProductFromForm(catalogProductId, v);
          upsertProduct(p);
          await syncPendingMedia(catalogProductId, v.media);
        } else {
          const p = await createProductFromForm(v);
          upsertProduct(p);
          await syncPendingMedia(p.id, v.media);
          clearDraft(editorKey);
          onSuccess?.();
        }
      } catch (e) {
        setSaveError(httpErrorMessageForUser(e, "Could not save. Try again."));
      } finally {
        setSaving(false);
      }
      return;
    }
    if (catalogProductId) {
      updateProduct(catalogProductId, v);
    } else {
      const id = addProduct(v);
      clearDraft(editorKey);
      onSuccess?.();
    }
  });

  const publishNow = form.handleSubmit(async (v) => {
    const next = { ...v, status: "pending_review" as const, publishAt: null };
    form.reset(next);
    setSaveError(null);
    if (!canWriteCatalog) {
      setSaveError("Catalog changes unlock after NeoShop approves your vendor account.");
      return;
    }
    if (getApiBaseUrl()) {
      setSaving(true);
      try {
        if (catalogProductId) {
          const p = await updateProductFromForm(catalogProductId, next);
          upsertProduct(p);
          await syncPendingMedia(catalogProductId, next.media);
        } else {
          const p = await createProductFromForm(next);
          upsertProduct(p);
          await syncPendingMedia(p.id, next.media);
          clearDraft(editorKey);
          onSuccess?.();
        }
      } catch (e) {
        setSaveError(
          httpErrorMessageForUser(e, "Could not submit for review. Try again.")
        );
      } finally {
        setSaving(false);
      }
      return;
    }
    if (catalogProductId) {
      updateProduct(catalogProductId, next);
    } else {
      const id = addProduct(next);
      clearDraft(editorKey);
      onSuccess?.();
    }
  });

  return (
    <FormProvider {...form}>
      <div className="grid gap-6">
        <VendorWriteGuardBanner area="catalog" status={vendorStatus} />
        <section className="grid gap-4">
          <h2 className="text-base font-semibold tracking-tight">General</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <VendorTextField
              control={form.control}
              name="name"
              label="Product name"
              placeholder="Wholesale ceramic mugs"
              className="md:col-span-2"
            />
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">SKU</Label>
              <Input
                readOnly
                disabled
                value={form.watch("sku")}
                className="bg-muted/50 h-9 font-mono text-xs tabular-nums"
              />
            </div>
            <Controller
              control={form.control}
              name="price"
              render={({ field, fieldState }) => (
                <div className="grid gap-1.5">
                  <Label htmlFor={field.name}>Price (USD)</Label>
                  <Input
                    id={field.name}
                    type="number"
                    step="0.01"
                    min={0.01}
                    aria-invalid={fieldState.invalid}
                    value={
                      Number.isFinite(field.value) ? String(field.value) : ""
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      field.onChange(
                        raw === "" ? NaN : Number.parseFloat(raw)
                      );
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                  {fieldState.error?.message ? (
                    <p className="text-destructive text-xs">
                      {fieldState.error.message}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>
          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Description</Label>
                <Textarea
                  id={field.name}
                  rows={5}
                  aria-invalid={fieldState.invalid}
                  placeholder="Specs, MOQ, lead times, packaging…"
                  {...field}
                />
                {fieldState.error?.message ? (
                  <p className="text-destructive text-xs">
                    {fieldState.error.message}
                  </p>
                ) : null}
              </div>
            )}
          />

          <CategorySelector />
          <TagSelector tagDraft={tagDraft} setTagDraft={setTagDraft} />
        </section>

        <section className="grid gap-4">
          <h2 className="text-base font-semibold tracking-tight">Media</h2>
          <ProductMediaGallery
            media={mediaList}
            previews={previews}
            mutationsDisabled={!canWriteCatalog}
            onChange={(next) =>
              form.setValue("media", next, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            onAddFiles={handleAddFiles}
            onRemove={handleRemoveMedia}
          />
        </section>

        <section className="grid max-w-2xl gap-4">
          <h2 className="text-base font-semibold tracking-tight">SEO</h2>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <VendorTextField
                control={form.control}
                name="seo.slug"
                label="URL slug"
                placeholder="wholesale-ceramic-mugs"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => {
                const name = form.getValues("name");
                if (name?.trim()) {
                  form.setValue("seo.slug", slugify(name), {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
            >
              From name
            </Button>
          </div>
          <VendorTextField
            control={form.control}
            name="seo.metaTitle"
            label="Meta title"
            placeholder="Shown in search results"
          />
          <Controller
            control={form.control}
            name="seo.metaDescription"
            render={({ field, fieldState }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Meta description</Label>
                <Textarea
                  id={field.name}
                  rows={3}
                  maxLength={320}
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>{field.value?.length ?? 0} / 320</span>
                  {fieldState.error?.message ? (
                    <span className="text-destructive">
                      {fieldState.error.message}
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          />
        </section>

        <div className="border-border flex flex-col gap-2 border-t pt-4">
          {saveError ? (
            <p className="text-destructive text-sm">{saveError}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={saving || !canWriteCatalog}
              onClick={() => void saveToCatalog()}
            >
              Save as draft
            </Button>
            <Button
              type="button"
              disabled={saving || !canWriteCatalog}
              onClick={() => void publishNow()}
            >
              Submit for review
            </Button>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}

function CategorySelector() {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<ProductFormValues>();
  const selected = watch("categoryIds") ?? [];
  const categories = useCategories();

  return (
    <div className="grid gap-2">
      <Label>Categories</Label>
      <div className="flex flex-wrap gap-2">
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No categories available. Categories are loaded from the server.
          </p>
        ) : (
          categories.map((c) => {
            const on = selected.includes(c.id);
            return (
              <Button
                key={c.id}
                type="button"
                size="sm"
                variant={on ? "default" : "outline"}
                className="rounded-full"
                onClick={() => {
                  const next = on
                    ? selected.filter((id) => id !== c.id)
                    : [...selected, c.id];
                  setValue("categoryIds", next, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              >
                {c.name}
              </Button>
            );
          })
        )}
      </div>
      {errors.categoryIds?.message ? (
        <p className="text-destructive text-xs">{errors.categoryIds.message}</p>
      ) : null}
    </div>
  );
}

function TagSelector({
  tagDraft,
  setTagDraft,
}: {
  tagDraft: string;
  setTagDraft: (v: string) => void;
}) {
  const { setValue, watch } = useFormContext<ProductFormValues>();
  const tags = watch("tags") ?? [];

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase();
    if (!t || tags.includes(t)) return;
    setValue("tags", [...tags, t], { shouldValidate: true, shouldDirty: true });
    setTagDraft("");
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="product-tag-input">Tags</Label>
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PRODUCT_TAGS.map((t) => {
          const on = tags.includes(t);
          return (
            <Button
              key={t}
              type="button"
              size="sm"
              variant={on ? "default" : "outline"}
              className="rounded-full capitalize"
              onClick={() => {
                if (on) {
                  setValue(
                    "tags",
                    tags.filter((x) => x !== t),
                    { shouldValidate: true, shouldDirty: true }
                  );
                } else {
                  setValue("tags", [...tags, t], {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
              }}
            >
              {t}
            </Button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant="secondary"
            className="rounded-full capitalize"
            onClick={() =>
              setValue(
                "tags",
                tags.filter((x) => x !== t),
                { shouldValidate: true, shouldDirty: true }
              )
            }
          >
            {t} ×
          </Button>
        ))}
      </div>
      <Input
        id="product-tag-input"
        placeholder="custom-tag"
        value={tagDraft}
        onChange={(e) => setTagDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag(tagDraft);
          }
        }}
      />
    </div>
  );
}
