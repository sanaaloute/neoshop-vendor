"use client";

import { useCallback, useMemo, useState } from "react";
import {
  GripVertical,
  ImageIcon,
  Star,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ProductMedia } from "./types";

type ProductMediaGalleryProps = {
  media: ProductMedia[];
  previews: Record<string, string>;
  onChange: (next: ProductMedia[]) => void;
  onAddFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
  /** When true, uploads, reorder, and remove are disabled (e.g. vendor not approved). */
  mutationsDisabled?: boolean;
};

function sortedMedia(media: ProductMedia[]) {
  return [...media].sort((a, b) => a.sortIndex - b.sortIndex);
}

function reorderById(
  media: ProductMedia[],
  draggedId: string,
  targetId: string
) {
  const list = sortedMedia(media);
  const from = list.findIndex((m) => m.id === draggedId);
  const to = list.findIndex((m) => m.id === targetId);
  if (from < 0 || to < 0 || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next.map((m, i) => ({ ...m, sortIndex: i }));
}

function setPrimary(media: ProductMedia[], primaryId: string): ProductMedia[] {
  const list = sortedMedia(media);
  const idx = list.findIndex((m) => m.id === primaryId);
  if (idx <= 0) return list.map((m, i) => ({ ...m, sortIndex: i }));
  const next = [...list];
  const [item] = next.splice(idx, 1);
  next.unshift(item);
  return next.map((m, i) => ({ ...m, sortIndex: i }));
}

export function ProductMediaGallery({
  media,
  previews,
  onChange,
  onAddFiles,
  onRemove,
  mutationsDisabled = false,
}: ProductMediaGalleryProps) {
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const ordered = useMemo(() => sortedMedia(media), [media]);

  const ingestFiles = useCallback(
    (list: FileList | File[]) => {
      if (mutationsDisabled) return;
      const arr = Array.from(list).filter((f) => f.type.startsWith("image/"));
      if (arr.length) onAddFiles(arr);
    },
    [onAddFiles, mutationsDisabled]
  );

  return (
    <div className="grid gap-4">
      {/* Upload Zone */}
      <div
        className={cn(
          "flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-4 py-10 text-center transition-all",
          mutationsDisabled
            ? "cursor-not-allowed opacity-60 bg-muted/20 border-border/40"
            : "cursor-pointer bg-muted/10 border-border/60 hover:border-primary/40 hover:bg-primary/[0.03]",
          dragOver && !mutationsDisabled && "border-primary bg-primary/5"
        )}
        onDragEnter={(e) => {
          if (mutationsDisabled) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          if (mutationsDisabled) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOver(false);
          }
        }}
        onDrop={(e) => {
          if (mutationsDisabled) return;
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) {
            ingestFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => {
          if (mutationsDisabled) return;
          document.getElementById("product-media-file-input")?.click();
        }}
        onKeyDown={(e) => {
          if (mutationsDisabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            document.getElementById("product-media-file-input")?.click();
          }
        }}
        role={mutationsDisabled ? undefined : "button"}
        tabIndex={mutationsDisabled ? undefined : 0}
      >
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
          <Upload className="size-5 text-primary" aria-hidden />
        </div>
        <div className="grid gap-1">
          <p className="text-sm font-medium">
            {mutationsDisabled
              ? "Media changes are locked until your vendor account is approved"
              : "Drag images here or click to upload"}
          </p>
          <p className="text-muted-foreground text-xs">
            Images only (JPG or PNG recommended). Files upload securely when you
            save or publish.
          </p>
        </div>
        <input
          id="product-media-file-input"
          type="file"
          accept="image/*"
          multiple
          disabled={mutationsDisabled}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) ingestFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Image Grid */}
      {ordered.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((m, index) => {
            const src = previews[m.id] ?? m.url;
            const isPrimary = index === 0;
            return (
              <li
                key={m.id}
                draggable={!mutationsDisabled}
                onDragStart={(e) => {
                  if (mutationsDisabled) return;
                  setDraggingId(m.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", m.id);
                }}
                onDragEnd={() => setDraggingId(null)}
                onDragOver={(e) => {
                  if (mutationsDisabled) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  if (mutationsDisabled) return;
                  e.preventDefault();
                  const fromId = e.dataTransfer.getData("text/plain");
                  if (fromId && fromId !== m.id) {
                    onChange(reorderById(media, fromId, m.id));
                  }
                  setDraggingId(null);
                }}
                className={cn(
                  "group relative flex flex-col gap-2 rounded-xl border bg-card/60 p-2 shadow-sm transition-all hover:bg-card",
                  draggingId === m.id && "opacity-50"
                )}
              >
                {/* Image */}
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted/40">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt={m.fileName}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <ImageIcon
                        className="size-10 text-muted-foreground/30"
                        aria-hidden
                      />
                    </div>
                  )}
                  {/* Primary Badge */}
                  {isPrimary && (
                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
                      <Star className="size-3 fill-current" />
                      Primary
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5 px-1">
                  <GripVertical
                    className={cn(
                      "size-4 text-muted-foreground/50",
                      mutationsDisabled ? "opacity-40" : "cursor-grab"
                    )}
                    aria-hidden
                  />
                  <p
                    className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground"
                    title={m.fileName}
                  >
                    {m.fileName}
                  </p>
                  {!isPrimary && !mutationsDisabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="size-6 text-muted-foreground hover:text-primary"
                      title="Set as primary"
                      onClick={() => onChange(setPrimary(media, m.id))}
                    >
                      <Star className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="size-6 text-muted-foreground hover:text-destructive"
                    disabled={mutationsDisabled}
                    onClick={() => onRemove(m.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
