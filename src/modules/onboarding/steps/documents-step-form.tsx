"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UI_LIMITS } from "@/config/ui";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { cn } from "@/lib/utils";
import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";

import { syncDocumentsStep } from "../onboarding-api";
import { uploadVendorOnboardingFiles } from "../upload-documents";
import { documentsSchema } from "../schemas";
import { useOnboardingAutosave } from "../use-onboarding-autosave";
import type { DocumentInfo } from "../types";

const FORM_ID = "vendor-onboarding-step-form";

const DOC_OPTIONS = [
  "Business registration",
  "Government ID",
  "Proof of address",
  "Bank statement",
] as const;

type DocumentsUploadRow = {
  name: string;
  status: "queued" | "uploading" | "done" | "error";
  errorMessage?: string;
};

export function DocumentsStepForm() {
  const draft = useOnboardingWizardStore((s) => s.draft.documents);
  const setStep = useOnboardingWizardStore((s) => s.setStep);
  const patchSection = useOnboardingWizardStore((s) => s.patchSection);
  const setApiBusy = useOnboardingWizardStore((s) => s.setApiBusy);
  const [stepError, setStepError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadRows, setUploadRows] = useState<DocumentsUploadRow[]>([]);
  const apiBusy = useOnboardingWizardStore((s) => s.apiBusy);
  const form = useForm<DocumentInfo>({
    resolver: zodResolver(documentsSchema),
    defaultValues: draft,
    mode: "onChange",
  });
  useOnboardingAutosave(form.control, "documents");
  const docTypes = useWatch({ control: form.control, name: "docTypes" }) ?? [];
  const docTypesKey = docTypes.join("|");
  const expectedFileCount = docTypes.length;
  const fileInputDisabled = apiBusy || expectedFileCount === 0;

  useEffect(() => {
    setUploadRows([]);
    setUploadError(null);
  }, [docTypesKey]);

  return (
    <FormProvider {...form}>
      <form
        id={FORM_ID}
        className="grid gap-4"
        onSubmit={form.handleSubmit(async (data) => {
          setStepError(null);
          setApiBusy(true);
          try {
            patchSection("documents", data);
            await syncDocumentsStep(data);
            setStep(3);
          } catch (e) {
            setStepError(
              httpErrorMessageForUser(e, "Could not save this step. Try again.")
            );
          } finally {
            setApiBusy(false);
          }
        })}
      >
        <div className="grid gap-2">
          <Label>Document types</Label>
          <p className="text-muted-foreground text-xs">
            Select everything you will upload for verification.
          </p>
          <div className="flex flex-wrap gap-2">
            {DOC_OPTIONS.map((opt) => {
              const selected = docTypes.includes(opt);
              return (
                <Button
                  key={opt}
                  type="button"
                  variant={selected ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    const next = selected
                      ? docTypes.filter((d) => d !== opt)
                      : [...docTypes, opt];
                    form.setValue("docTypes", next, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                >
                  {opt}
                </Button>
              );
            })}
          </div>
          {form.formState.errors.docTypes?.message ? (
            <p className="text-destructive text-xs">
              {form.formState.errors.docTypes.message}
            </p>
          ) : null}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="onb-files">Upload files</Label>
          <p className="text-muted-foreground text-xs">
            Files upload securely and links are filled in automatically.{" "}
            {expectedFileCount > 0 ? (
              <>
                Pick exactly {expectedFileCount} file
                {expectedFileCount === 1 ? "" : "s"} in the same order as your
                document types.
              </>
            ) : (
              <>Pick one file per document type you select (same order).</>
            )}{" "}
            Max {UI_LIMITS.ONBOARDING_FILE_MAX_BYTES / (1024 * 1024)} MB each — PDF or images.
          </p>
          {expectedFileCount === 0 ? (
            <p className="text-muted-foreground text-xs">
              Select at least one document type above before choosing files.
            </p>
          ) : null}
          <Input
            id="onb-files"
            type="file"
            multiple
            accept=".pdf,image/jpeg,image/png,image/webp,image/gif,application/pdf"
            disabled={fileInputDisabled}
            className={cn(
              "cursor-pointer",
              fileInputDisabled && "cursor-not-allowed opacity-60"
            )}
            aria-busy={apiBusy}
            onChange={(e) => {
              const list = e.target.files;
              if (!list?.length) return;
              const files = Array.from(list);
              if (files.length !== expectedFileCount) {
                setUploadError(
                  `You picked ${files.length} file${files.length === 1 ? "" : "s"} but ${expectedFileCount} document type${expectedFileCount === 1 ? "" : "s"} are selected. Use a multi-select that includes exactly ${expectedFileCount} file${expectedFileCount === 1 ? "" : "s"} (same order as types).`
                );
                e.target.value = "";
                return;
              }
              setUploadError(null);
              setUploadRows(
                files.map((f) => ({ name: f.name, status: "queued" }))
              );
              setApiBusy(true);
              void (async () => {
                try {
                  const { urls, names } = await uploadVendorOnboardingFiles(
                    files,
                    (p) => {
                      setUploadRows((prev) => {
                        const next = [...prev];
                        const row = next[p.index];
                        if (!row) return prev;
                        if (p.phase === "start") {
                          next[p.index] = { name: row.name, status: "uploading" };
                        } else if (p.phase === "done") {
                          next[p.index] = { name: row.name, status: "done" };
                        } else {
                          next[p.index] = {
                            name: row.name,
                            status: "error",
                            errorMessage: p.errorMessage,
                          };
                        }
                        return next;
                      });
                    }
                  );
                  form.setValue("fileUrls", urls, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  form.setValue("fileNames", names, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                } catch (err) {
                  setUploadError(
                    err instanceof Error ? err.message : "Upload failed"
                  );
                } finally {
                  setApiBusy(false);
                  e.target.value = "";
                }
              })();
            }}
          />
          {uploadRows.length > 0 ? (
            <ul
              className="text-muted-foreground border-border mt-2 space-y-1 border-t pt-2 text-xs"
              aria-live="polite"
            >
              {uploadRows.map((row, i) => (
                <li
                  key={`${row.name}-${i}`}
                  className="flex items-start gap-2"
                >
                  {row.status === "uploading" ? (
                    <Loader2
                      className="mt-0.5 size-3.5 shrink-0 animate-spin"
                      aria-hidden
                    />
                  ) : row.status === "done" ? (
                    <Check
                      className="text-primary mt-0.5 size-3.5 shrink-0"
                      aria-hidden
                    />
                  ) : row.status === "error" ? (
                    <span
                      className="text-destructive mt-0.5 inline-block w-3.5 shrink-0 text-center"
                      aria-hidden
                    >
                      ×
                    </span>
                  ) : (
                    <span
                      className="border-border mt-1 inline-block size-2.5 shrink-0 rounded-full border"
                      aria-hidden
                    />
                  )}
                  <span
                    className={
                      row.status === "error" ? "text-destructive" : undefined
                    }
                  >
                    {row.name}
                    {row.errorMessage ? ` — ${row.errorMessage}` : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {uploadError ? (
            <p className="text-destructive text-xs" role="alert">
              {uploadError}
            </p>
          ) : null}
        </div>
        <Controller
          control={form.control}
          name="fileUrls"
          render={({ field, fieldState }) => (
            <div className="grid gap-1.5">
              <Label htmlFor="onb-file-urls">Document URLs (optional)</Label>
              <p className="text-muted-foreground text-xs">
                Paste one HTTPS URL per line if you prefer not to upload here
                (same order as document types). Uploading files above replaces
                these values.
              </p>
              <Textarea
                id="onb-file-urls"
                rows={4}
                placeholder={"https://…\nhttps://…"}
                aria-invalid={fieldState.invalid}
                value={field.value.join("\n")}
                onChange={(e) => {
                  const lines = e.target.value
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean);
                  field.onChange(lines);
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
          name="notes"
          render={({ field, fieldState }) => (
            <div className="grid gap-1.5">
              <Label htmlFor={field.name}>Notes for reviewers (optional)</Label>
              <Textarea
                id={field.name}
                rows={3}
                maxLength={UI_LIMITS.MAX_NOTES_LENGTH}
                placeholder="Anything we should know…"
                aria-invalid={fieldState.invalid}
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
        {stepError ? (
          <p className="text-destructive text-sm" role="alert">
            {stepError}
          </p>
        ) : null}
      </form>
    </FormProvider>
  );
}
