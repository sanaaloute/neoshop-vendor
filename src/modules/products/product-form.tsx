"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import {
  Check,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  ImageIcon,
  Save,
  Search,
  Send,
  Sparkles,
} from "lucide-react";

import { VendorTextField } from "@/components/forms/vendor-text-field";
import { VendorMuted } from "@/components/layout/typography";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  attachProductMedia,
  deleteProductMedia,
  getProduct,
} from "@/services/vendor/products-api";
import { uploadStorageObject } from "@/services/vendor/storage-api";
import { useStorageUpload } from "@/hooks/use-storage-upload";
import { useVendorWritesAllowed } from "@/hooks/use-vendor-writes";
import { useCategories } from "@/hooks/use-categories";
import { useProductCatalogStore } from "@/store/product-catalog-store";
import { useProductEditorDraftStore } from "@/store/product-editor-draft-store";
import { cn } from "@/lib/utils";
import { BulkPricingEditor } from "./bulk-pricing-editor";

import { ProductMediaGallery } from "./product-media-gallery";
import { productFormSchema } from "./schemas";
import type { ProductFormValues } from "./types";

function extractStoragePath(url: string, bucket: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf(bucket);
    if (idx >= 0 && idx < parts.length - 1) {
      return parts.slice(idx + 1).join("/");
    }
  } catch {
    /* not a valid URL */
  }
  return null;
}

type ProductFormProps = {
  editorKey: string;
  catalogProductId: string | null;
  defaultValues: ProductFormValues;
  onSuccess?: (
    createdProductId?: string,
    wasSubmittedForReview?: boolean
  ) => void;
  onValuesSnapshot?: (values: ProductFormValues) => void;
  onSavingChange?: (saving: boolean) => void;
};

export function ProductForm({
  editorKey,
  catalogProductId,
  defaultValues,
  onSuccess,
  onValuesSnapshot,
  onSavingChange,
}: ProductFormProps) {
  const t = useTranslations("products");
  const { canWriteCatalog } = useVendorWritesAllowed();
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
  const storagePathsByMediaId = useRef(new Map<string, string>());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { remove } = useStorageUpload();

  useEffect(() => {
    onSavingChange?.(saving);
  }, [saving, onSavingChange]);

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
    async (id: string) => {
      if (!canWriteCatalog) return;
      const url = previews[id];
      if (url?.startsWith("blob:")) {
        URL.revokeObjectURL(url);
        blobUrls.current.delete(url);
      }
      filesByMediaId.current.delete(id);
      if (originalMediaIds.current.has(id)) {
        removedMediaIds.current.add(id);
        const mediaUrl = form.getValues("media").find((m) => m.id === id)?.url;
        const path = mediaUrl
          ? extractStoragePath(mediaUrl, "product-media")
          : null;
        if (path) {
          storagePathsByMediaId.current.set(id, path);
        }
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
    const entries = media
      .map((m) => ({ m, file: filesByMediaId.current.get(m.id) }))
      .filter((e): e is { m: ProductFormValues["media"][number]; file: File } =>
        Boolean(e.file)
      );

    const uploadedLocalIds: string[] = [];

    for (const { m, file } of entries) {
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
      storagePathsByMediaId.current.set(m.id, up.path);
      uploadedLocalIds.push(m.id);
    }

    for (const mediaId of removedMediaIds.current) {
      try {
        await deleteProductMedia(productId, mediaId);
      } catch (e) {
        console.warn("Failed to delete product media", mediaId, e);
      }
      const path = storagePathsByMediaId.current.get(mediaId);
      if (path) {
        try {
          await remove("product-media", path);
        } catch {
          /* best-effort storage cleanup */
        }
        storagePathsByMediaId.current.delete(mediaId);
      }
    }
    removedMediaIds.current.clear();
    const refreshed = await getProduct(productId);
    const refreshedProduct = mapApiProductRowToProduct(
      refreshed as Record<string, unknown>
    );
    upsertProduct(refreshedProduct);
    // Replace local IDs with real backend IDs/URLs so the draft stays in sync.
    form.setValue("media", refreshedProduct.media, {
      shouldDirty: true,
      shouldValidate: true,
    });
    // Clean up blob previews for the uploaded files.
    if (uploadedLocalIds.length > 0) {
      setPreviews((prev) => {
        const next = { ...prev };
        for (const id of uploadedLocalIds) {
          const blobUrl = next[id];
          if (blobUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(blobUrl);
            blobUrls.current.delete(blobUrl);
          }
          delete next[id];
        }
        return next;
      });
    }
  };

  const saveToCatalog = form.handleSubmit(async (v) => {
    setSaveError(null);
    if (!canWriteCatalog) {
      setSaveError(t("catalogLocked"));
      return;
    }
    if (getApiBaseUrl()) {
      setSaving(true);
      try {
        if (catalogProductId) {
          const p = await updateProductFromForm(catalogProductId, v);
          upsertProduct(p);
          await syncPendingMedia(catalogProductId, v.media);
          clearDraft(editorKey);
        } else {
          const p = await createProductFromForm(v);
          upsertProduct(p);
          await syncPendingMedia(p.id, v.media);
          clearDraft(editorKey);
          onSuccess?.(p.id);
        }
      } catch (e) {
        setSaveError(httpErrorMessageForUser(e, t("couldNotSave")));
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
      setSaveError(t("catalogLocked"));
      return;
    }
    if (getApiBaseUrl()) {
      setSaving(true);
      try {
        if (catalogProductId) {
          const p = await updateProductFromForm(catalogProductId, next);
          upsertProduct(p);
          await syncPendingMedia(catalogProductId, next.media);
          clearDraft(editorKey);
          onSuccess?.(catalogProductId, true);
        } else {
          const p = await createProductFromForm(next);
          upsertProduct(p);
          await syncPendingMedia(p.id, next.media);
          clearDraft(editorKey);
          onSuccess?.(p.id, true);
        }
      } catch (e) {
        setSaveError(httpErrorMessageForUser(e, t("couldNotSubmitReview")));
      } finally {
        setSaving(false);
      }
      return;
    }
    if (catalogProductId) {
      updateProduct(catalogProductId, next);
      clearDraft(editorKey);
      onSuccess?.(catalogProductId, true);
    } else {
      const id = addProduct(next);
      clearDraft(editorKey);
      onSuccess?.(id, true);
    }
  });

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-5">
        {/* Gallery — First & Emphasized */}
        <Card className="glass-card shadow-glass overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ImageIcon className="text-primary size-4" />
              {t("productGallery")}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card className="glass-card shadow-glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="text-primary size-4" />
              {t("productDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <VendorTextField
              control={form.control}
              name="name"
              label={t("productName")}
              placeholder={t("productNamePlaceholder")}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                control={form.control}
                name="moq"
                render={({ field, fieldState }) => (
                  <div className="grid gap-1.5">
                    <Label htmlFor={field.name}>{t("moq")}</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="1"
                      min={1}
                      aria-invalid={fieldState.invalid}
                      value={
                        Number.isFinite(field.value) ? String(field.value) : ""
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        field.onChange(
                          raw === "" ? NaN : Number.parseInt(raw, 10)
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
              <Controller
                control={form.control}
                name="currency"
                render={({ field, fieldState }) => (
                  <div className="grid gap-1.5">
                    <Label htmlFor={field.name}>{t("currency")}</Label>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!canWriteCatalog}
                    >
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder={t("currency")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CNY">{t("currencyCNY")}</SelectItem>
                        <SelectItem value="XOF">{t("currencyXOF")}</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.error?.message ? (
                      <p className="text-destructive text-xs">
                        {fieldState.error.message}
                      </p>
                    ) : null}
                  </div>
                )}
              />
            </div>
            <BulkPricingEditor control={form.control} />
            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <div className="grid gap-1.5">
                  <Label htmlFor={field.name}>{t("description")}</Label>
                  <Textarea
                    id={field.name}
                    rows={5}
                    aria-invalid={fieldState.invalid}
                    placeholder={t("descriptionPlaceholder")}
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
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="glass-card shadow-glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FolderOpen className="text-primary size-4" />
              {t("categories")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategorySelector />
          </CardContent>
        </Card>

        {/* SEO — Collapsible */}
        <SeoSection />

        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 z-20 -mx-4 px-4 pb-4 md:-mx-6 md:px-6 md:pb-6">
          <div className="glass-card shadow-glass rounded-xl p-4">
            {saveError ? (
              <p className="text-destructive mb-3 text-sm">{saveError}</p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <VendorMuted className="text-xs">
                {saving
                  ? t("saving")
                  : catalogProductId
                    ? t("updateProductChanges")
                    : t("autoSavedLocally")}
              </VendorMuted>
              <div className="flex flex-wrap gap-2">
                {catalogProductId ? (
                  <Button
                    type="button"
                    disabled={saving || !canWriteCatalog}
                    onClick={() => void saveToCatalog()}
                    className="gap-1.5"
                  >
                    <Check className="size-4" />
                    {t("update")}
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={saving || !canWriteCatalog}
                      onClick={() => void saveToCatalog()}
                      className="gap-1.5"
                    >
                      <Save className="size-4" />
                      {t("saveDraft")}
                    </Button>
                    <Button
                      type="button"
                      disabled={saving || !canWriteCatalog}
                      onClick={() => void publishNow()}
                      className="gap-1.5"
                    >
                      <Send className="size-4" />
                      {t("submitReview")}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}

/* ─── Modern Category Selector ─── */
function CategorySelector() {
  const t = useTranslations("products");
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<ProductFormValues>();
  const selected = watch("categoryIds") ?? [];
  const categories = useCategories();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  return (
    <div className="grid gap-3">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder={t("searchCategories")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            {t("noCategoriesAvailable")}
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            {t("noCategoriesMatch")}
          </p>
        ) : (
          filtered.map((c) => {
            const on = selected.includes(c.id);
            return (
              <Button
                key={c.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = on
                    ? selected.filter((id) => id !== c.id)
                    : [...selected, c.id];
                  setValue("categoryIds", next, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                  on
                    ? "border-primary/30 bg-primary/15 text-primary"
                    : "border-border/60 bg-background/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {on && (
                  <span className="bg-primary text-primary-foreground flex size-3.5 items-center justify-center rounded-full text-[8px] font-bold">
                    ✓
                  </span>
                )}
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

/* ─── Collapsible SEO Section ─── */
function SeoSection() {
  const t = useTranslations("products");
  const [open, setOpen] = useState(false);
  const { control, setValue, getValues } = useFormContext<ProductFormValues>();
  const watchedName = useWatch({ control, name: "name" });
  const watchedSlug = useWatch({ control, name: "seo.slug" });
  const slugManuallySet = useRef(Boolean(getValues("seo.slug")));

  useEffect(() => {
    if (slugManuallySet.current) return;
    if (!watchedName?.trim()) return;
    const generated = slugify(watchedName);
    if (
      !watchedSlug ||
      watchedSlug === slugify(watchedName.slice(0, -1) || watchedName)
    ) {
      setValue("seo.slug", generated, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [watchedName, watchedSlug, setValue]);

  return (
    <Card className="glass-card shadow-glass overflow-hidden">
      <Button
        type="button"
        variant="ghost"
        className="hover:bg-muted/20 flex w-full items-center justify-between px-5 py-4 text-left transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Search className="text-primary size-4" />
          <CardTitle className="text-base font-semibold">
            {t("seoSettings")}
          </CardTitle>
          <span className="text-muted-foreground ml-1 text-xs">
            ({t("optional")})
          </span>
        </div>
        {open ? (
          <ChevronUp className="text-muted-foreground size-4" />
        ) : (
          <ChevronDown className="text-muted-foreground size-4" />
        )}
      </Button>
      {open && (
        <CardContent className="border-border/40 grid gap-5 border-t pt-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <VendorTextField
                control={control}
                name="seo.slug"
                label={t("urlSlug")}
                placeholder={t("urlSlugPlaceholder")}
                onChange={() => {
                  slugManuallySet.current = true;
                }}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => {
                const name = getValues("name");
                if (name?.trim()) {
                  slugManuallySet.current = false;
                  setValue("seo.slug", slugify(name), {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
            >
              {t("fromName")}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
