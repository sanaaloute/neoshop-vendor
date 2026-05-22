"use client";

import { useCallback, useMemo, useState } from "react";
import { GripVertical, ImageIcon, Trash2, Upload } from "lucide-react";

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
      <div
        className={cn(
          "border-border/80 bg-muted/20 flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
          mutationsDisabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer",
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
        <Upload className="text-muted-foreground size-8" aria-hidden />
        <p className="text-sm font-medium">
          {mutationsDisabled
            ? "Media changes are locked until your vendor account is approved"
            : "Drag images here or click to upload"}
        </p>
        <p className="text-muted-foreground text-xs">
          Images only (JPG or PNG recommended). Files upload securely when you
          save or publish.
        </p>
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

      {ordered.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((m) => {
            const src = previews[m.id];
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
                  "border-border bg-card flex gap-2 rounded-lg border p-2 shadow-sm transition-opacity",
                  draggingId === m.id && "opacity-60"
                )}
              >
                <div className="text-muted-foreground flex shrink-0 flex-col items-center gap-1">
                  <GripVertical
                    className={cn(
                      "size-4",
                      mutationsDisabled ? "opacity-40" : "cursor-grab"
                    )}
                    aria-hidden
                  />
                </div>
                <div className="bg-muted relative aspect-square w-24 shrink-0 overflow-hidden rounded-md">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={m.fileName} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <ImageIcon className="size-8 opacity-40" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
                  <p
                    className="truncate text-xs font-medium"
                    title={m.fileName}
                  >
                    {m.fileName}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-8 self-start"
                    disabled={mutationsDisabled}
                    onClick={() => onRemove(m.id)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Remove
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
