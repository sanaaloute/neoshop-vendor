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
import {
  ChevronDown,
  ChevronUp,
  FolderOpen,
  GripVertical,
  ImageIcon,
  Save,
  Search,
  Send,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { VendorTextField } from "@/components/forms/vendor-text-field";
import { VendorMuted } from "@/components/layout/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  attachProductMedia,
  deleteProductMedia,
  getProduct,
} from "@/services/vendor/products-api";
import { uploadStorageObject } from "@/services/vendor/storage-api";
import { useVendorWritesAllowed } from "@/hooks/use-vendor-writes";
import { useCategories } from "@/hooks/use-categories";
import { useProductCatalogStore } from "@/store/product-catalog-store";
import { useProductEditorDraftStore } from "@/store/product-editor-draft-store";
import { cn } from "@/lib/utils";

import { SUGGESTED_PRODUCT_TAGS } from "./constants";
import { ProductMediaGallery } from "./product-media-gallery";
import { productFormSchema } from "./schemas";
import type { ProductFormValues } from "./types";

type ProductFormProps = {
  editorKey: string;
  catalogProductId: string | null;
  defaultValues: ProductFormValues;
  onSuccess?: (createdProductId?: string, wasSubmittedForReview?: boolean) => void;
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
  const watchedName = useWatch({ control: form.control, name: "name" });

  useEffect(() => {
    if (!watchedName?.trim()) return;
    const currentSlug = form.getValues("seo.slug");
    const generated = slugify(watchedName);
    if (
      !currentSlug ||
      currentSlug === slugify(watchedName.slice(0, -1) || watchedName)
    ) {
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
      setSaveError(
        "Catalog changes unlock after Barkosem approves your vendor account."
      );
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
          onSuccess?.(p.id);
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
      setSaveError(
        "Catalog changes unlock after Barkosem approves your vendor account."
      );
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
              <ImageIcon className="size-4 text-primary" />
              Product Gallery
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
              <Sparkles className="size-4 text-primary" />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <VendorTextField
              control={form.control}
              name="name"
              label="Product Name"
              placeholder="Wholesale ceramic mugs"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                control={form.control}
                name="price"
                render={({ field, fieldState }) => (
                  <div className="grid gap-1.5">
                    <Label htmlFor={field.name}>Price</Label>
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
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="glass-card shadow-glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FolderOpen className="size-4 text-primary" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategorySelector />
          </CardContent>
        </Card>

        {/* Tags */}
        <Card className="glass-card shadow-glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Tag className="size-4 text-primary" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagSelector />
          </CardContent>
        </Card>

        {/* SEO — Collapsible */}
        <SeoSection />

        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 z-20 -mx-4 px-4 pb-4 md:-mx-6 md:px-6 md:pb-6">
          <div className="glass-card shadow-glass rounded-xl p-4">
            {saveError ? (
              <p className="text-destructive text-sm mb-3">{saveError}</p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <VendorMuted className="text-xs">
                {saving
                  ? "Saving…"
                  : "Changes are auto-saved locally. Submit when ready."}
              </VendorMuted>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving || !canWriteCatalog}
                  onClick={() => void saveToCatalog()}
                  className="gap-1.5"
                >
                  <Save className="size-4" />
                  Save Draft
                </Button>
                <Button
                  type="button"
                  disabled={saving || !canWriteCatalog}
                  onClick={() => void publishNow()}
                  className="gap-1.5"
                >
                  <Send className="size-4" />
                  Submit Review
                </Button>
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No categories available. Categories are loaded from the server.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No categories match your search.
          </p>
        ) : (
          filtered.map((c) => {
            const on = selected.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
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
                  <span className="flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground font-bold">
                    ✓
                  </span>
                )}
                {c.name}
              </button>
            );
          })
        )}
      </div>
      {errors.categoryIds?.message ? (
        <p className="text-destructive text-xs">
          {errors.categoryIds.message}
        </p>
      ) : null}
    </div>
  );
}

/* ─── Modern Tag Input ─── */
function TagSelector() {
  const { setValue, watch } = useFormContext<ProductFormValues>();
  const tags = watch("tags") ?? [];
  const [draft, setDraft] = useState("");

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase();
    if (!t || tags.includes(t)) return;
    setValue("tags", [...tags, t], { shouldValidate: true, shouldDirty: true });
    setDraft("");
  };

  const removeTag = (t: string) => {
    setValue(
      "tags",
      tags.filter((x) => x !== t),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  return (
    <div className="grid gap-3">
      {/* Suggested tags */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PRODUCT_TAGS.map((t) => {
          const on = tags.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => {
                if (on) {
                  removeTag(t);
                } else {
                  setValue("tags", [...tags, t], {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
              }}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-all",
                on
                  ? "border-primary/30 bg-primary/15 text-primary"
                  : "border-border/60 bg-background/40 text-muted-foreground hover:bg-muted/50"
              )}
            >
              {on ? "✓" : "+"} {t}
            </button>
          );
        })}
      </div>

      {/* Active tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="cursor-pointer gap-1 capitalize pr-1.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => removeTag(t)}
            >
              {t}
              <X className="size-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Custom tag input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add custom tag…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(draft);
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addTag(draft)}
          disabled={!draft.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

/* ─── Collapsible SEO Section ─── */
function SeoSection() {
  const [open, setOpen] = useState(false);
  const { control, setValue, getValues } = useFormContext<ProductFormValues>();

  return (
    <Card className="glass-card shadow-glass overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Search className="size-4 text-primary" />
          <CardTitle className="text-base font-semibold">
            SEO Settings
          </CardTitle>
          <span className="text-xs text-muted-foreground ml-1">
            (Optional)
          </span>
        </div>
        {open ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <CardContent className="grid gap-5 border-t border-border/40 pt-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <VendorTextField
                control={control}
                name="seo.slug"
                label="URL Slug"
                placeholder="wholesale-ceramic-mugs"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => {
                const name = getValues("name");
                if (name?.trim()) {
                  setValue("seo.slug", slugify(name), {
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
            control={control}
            name="seo.metaTitle"
            label="Meta Title"
            placeholder="Shown in search results"
          />
          <Controller
            control={control}
            name="seo.metaDescription"
            render={({ field, fieldState }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Meta Description</Label>
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
        </CardContent>
      )}
    </Card>
  );
}
