"use client";

import { useCallback, useState } from "react";
import { FileIcon, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { DisputeEvidence } from "./types";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

type DisputeEvidencePanelProps = {
  evidence: DisputeEvidence[];
  onAdd: (files: Pick<DisputeEvidence, "filename" | "sizeBytes">[]) => void;
  onRemove?: (id: string) => void;
  readOnly?: boolean;
  className?: string;
};

export function DisputeEvidencePanel({
  evidence,
  onAdd,
  onRemove,
  readOnly,
  className,
}: DisputeEvidencePanelProps) {
  const [dragOver, setDragOver] = useState(false);

  const ingest = useCallback(
    (list: FileList | File[]) => {
      const arr = Array.from(list).filter(
        (f) =>
          f.type.startsWith("image/") ||
          f.type === "application/pdf" ||
          f.name.toLowerCase().endsWith(".pdf")
      );
      if (!arr.length) return;
      onAdd(
        arr.map((f) => ({
          filename: f.name,
          sizeBytes: f.size,
        }))
      );
    },
    [onAdd]
  );

  return (
    <div className={cn("space-y-3", className)}>
      {!readOnly ? (
        <div
          className={cn(
            "border-border/80 bg-muted/15 flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-6 text-center transition-colors",
            dragOver && "border-primary bg-primary/5"
          )}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDragOver(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.length) ingest(e.dataTransfer.files);
          }}
          onClick={() =>
            document.getElementById("dispute-evidence-file-input")?.click()
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              document.getElementById("dispute-evidence-file-input")?.click();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <Upload className="text-muted-foreground size-7" aria-hidden />
          <p className="text-sm font-medium">Upload evidence</p>
          <p className="text-muted-foreground text-xs">
            Images or PDF. Files are attached when your marketplace accepts
            them.
          </p>
          <input
            id="dispute-evidence-file-input"
            type="file"
            accept="image/*,.pdf,application/pdf"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.length) ingest(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      ) : null}

      {evidence.length ? (
        <ul className="space-y-2">
          {evidence.map((ev) => (
            <li
              key={ev.id}
              className="border-border/60 bg-card/50 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileIcon
                  className="text-muted-foreground size-4 shrink-0"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="truncate font-medium">{ev.filename}</p>
                  <p className="text-muted-foreground text-[11px] tabular-nums">
                    {formatBytes(ev.sizeBytes)} ·{" "}
                    {new Date(ev.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {!readOnly && onRemove ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => onRemove(ev.id)}
                  aria-label={`Remove ${ev.filename}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-xs">
          No files yet
          {readOnly ? "." : " — add photos or PDFs to strengthen your case."}
        </p>
      )}
    </div>
  );
}
