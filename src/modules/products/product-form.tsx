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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { attachProductMedia, getProduct } from "@/services/vendor/products-api";
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
  onCatalogCreated?: (id: string) => void;
  onValuesSnapshot?: (values: ProductFormValues) => void;
};

export function ProductForm({
  editorKey,
  catalogProductId,
  defaultValues,
  onCatalogCreated,
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
          onCatalogCreated?.(p.id);
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
      onCatalogCreated?.(id);
    }
  });

  const publishNow = form.handleSubmit(async (v) => {
    const next = { ...v, status: "published" as const, publishAt: null };
    form.reset(next);
    setSaveError(null);
    if (!canWriteCatalog) {
      setSaveError("Publishing unlocks after NeoShop approves your vendor account.");
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
          onCatalogCreated?.(p.id);
        }
      } catch (e) {
        setSaveError(
          httpErrorMessageForUser(e, "Could not publish. Try again.")
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
      onCatalogCreated?.(id);
    }
  });

  return (
    <FormProvider {...form}>
      <div className="grid gap-6">
        <VendorWriteGuardBanner area="catalog" status={vendorStatus} />
        <Tabs defaultValue="general" className="gap-4">
          <TabsList variant="line" className="w-full max-w-2xl flex-wrap">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="publishing">Publishing</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <VendorTextField
                control={form.control}
                name="name"
                label="Product name"
                placeholder="Wholesale ceramic mugs"
                className="md:col-span-2"
              />
              <div className="grid gap-1.5">
                <Label className="text-sm font-medium">SKU (optional)</Label>
                <Input
                  readOnly
                  disabled
                  value={form.watch("sku")}
                  className="bg-muted/50 h-9 font-mono text-xs tabular-nums"
                />
                <p className="text-black text-[10px]">
                  Auto-generated from product name
                </p>
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
                      <p className="text-red-600 text-xs">
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
                    <p className="text-red-600 text-xs">
                      {fieldState.error.message}
                    </p>
                  ) : null}
                </div>
              )}
            />

            <CategorySelector />
            <TagSelector tagDraft={tagDraft} setTagDraft={setTagDraft} />
          </TabsContent>

          <TabsContent value="media">
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
          </TabsContent>

          <TabsContent value="seo" className="grid max-w-2xl gap-4">
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
                  <div className="text-black flex justify-between text-xs">
                    <span>{field.value?.length ?? 0} / 320</span>
                    {fieldState.error?.message ? (
                      <span className="text-red-600">
                        {fieldState.error.message}
                      </span>
                    ) : null}
                  </div>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="publishing" className="grid max-w-xl gap-4">
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <div className="grid gap-2">
                  <Label>Workflow status</Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["draft", "Draft"],
                        ["pending_review", "In review"],
                        ["published", "Published"],
                        ["hidden", "Hidden"],
                        ["scheduled", "Scheduled"],
                        ["archived", "Archived"],
                        ["rejected", "Rejected"],
                      ] as const
                    ).map(([val, label]) => (
                      <Button
                        key={val}
                        type="button"
                        size="sm"
                        variant={field.value === val ? "default" : "outline"}
                        className="rounded-full"
                        onClick={() => {
                          field.onChange(val);
                          if (val !== "scheduled") {
                            form.setValue("publishAt", null);
                          }
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            />
            {form.watch("status") === "scheduled" ? (
              <Controller
                control={form.control}
                name="publishAt"
                render={({ field, fieldState }) => (
                  <div className="grid gap-1.5">
                    <Label htmlFor={field.name}>Publish at</Label>
                    <Input
                      id={field.name}
                      type="datetime-local"
                      aria-invalid={fieldState.invalid}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? e.target.value : null)
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                    {form.formState.errors.publishAt?.message ? (
                      <p className="text-destructive text-xs">
                        {form.formState.errors.publishAt.message}
                      </p>
                    ) : null}
                  </div>
                )}
              />
            ) : null}
            <p className="text-black text-xs">
              Drafts stay private. Published products appear to buyers according
              to your marketplace rules. Use Scheduled to set a future publish
              time.
            </p>
          </TabsContent>
        </Tabs>

        <div className="border-gray-300 flex flex-col gap-2 border-t pt-4">
          {saveError ? (
            <p className="text-red-600 text-sm">{saveError}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={saving || !canWriteCatalog}
              onClick={() => void saveToCatalog()}
            >
              {catalogProductId ? "Save to catalog" : "Create in catalog"}
            </Button>
            <Button
              type="button"
              disabled={saving || !canWriteCatalog}
              onClick={() => void publishNow()}
            >
              Publish now
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
      <p className="text-muted-foreground text-xs">
        Select one or more categories.
      </p>
      <div className="flex flex-wrap gap-2">
        {categories.length === 0 ? (
          <p className="text-black text-xs">
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
        <p className="text-red-600 text-xs">{errors.categoryIds.message}</p>
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
      <Label htmlFor="product-tag-input">Tags (optional)</Label>
      <p className="text-black text-xs">
        Suggested tags or add your own (press Enter).
      </p>
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
