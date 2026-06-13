"use client";

import { useRef, useState, useCallback } from "react";
import {
  UploadCloud,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
  ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

import { useOnboardingWizardStore } from "@/store/onboarding-wizard-store";
import { ONBOARDING_STEP_FORM_ID } from "@/modules/onboarding/onboarding-step-forms";
import { uploadDraftDocuments, removeVendorDocument } from "@/modules/onboarding/onboarding-api";
import type { DraftDocument } from "@/modules/onboarding/types";
import type { VendorDocumentType } from "@/services/vendor/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const UI_LIMITS = {
  ONBOARDING_FILE_MAX_BYTES: 10 * 1024 * 1024, // 10MB
};

function fileIconFromMime(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  return FileText;
}


export function DocumentsStepForm() {
  const t = useTranslations("onboarding");
  const draft = useOnboardingWizardStore((s) => s.draft);
  const documents = draft.documents;
  const setStep = useOnboardingWizardStore((s) => s.setStep);
  const setApiBusy = useOnboardingWizardStore((s) => s.setApiBusy);
  const addDocument = useOnboardingWizardStore((s) => s.addDocument);
  const updateDocument = useOnboardingWizardStore((s) => s.updateDocument);
  const replaceDocument = useOnboardingWizardStore((s) => s.replaceDocument);
  const removeDocument = useOnboardingWizardStore((s) => s.removeDocument);

  const documentTypes: { value: VendorDocumentType; label: string; description: string }[] = [
    { value: "BUSINESS_REGISTRATION", label: t("steps.documents.businessRegistrationLabel"), description: t("steps.documents.businessRegistrationDescription") },
    { value: "TAX_CERTIFICATE", label: t("steps.documents.taxCertificateLabel"), description: t("steps.documents.taxCertificateDescription") },
    { value: "BANK_PROOF", label: t("steps.documents.bankProofLabel"), description: t("steps.documents.bankProofDescription") },
    { value: "IDENTITY", label: t("steps.documents.identityLabel"), description: t("steps.documents.identityDescription") },
    { value: "OTHER", label: t("steps.documents.otherLabel"), description: t("steps.documents.otherDescription") },
  ];

  const [selectedType, setSelectedType] = useState<VendorDocumentType>("BUSINESS_REGISTRATION");
  const [dragActive, setDragActive] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doneDocs = documents.filter((d) => d.status === "done");
  const uploadingDocs = documents.filter((d) => d.status === "uploading");

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setGlobalError(null);

      const validFiles: File[] = [];
      for (const file of Array.from(files)) {
        if (file.size > UI_LIMITS.ONBOARDING_FILE_MAX_BYTES) {
          setGlobalError(t("steps.documents.exceedsLimit", { fileName: file.name }));
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      // Create temp docs immediately so UI shows upload progress
      const tempDocs: DraftDocument[] = validFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: selectedType,
        fileUrl: "",
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        status: "uploading",
        progress: 0,
        storageBucket: undefined,
        storagePath: undefined,
      }));

      for (const tempDoc of tempDocs) {
        addDocument(tempDoc);
      }

      setApiBusy(true);
      try {
        const result = await uploadDraftDocuments(
          validFiles,
          selectedType,
          tempDocs.map((d) => d.id),
          (id, status, progress) => {
            updateDocument(id, { status, progress });
          }
        );

        // Replace temp docs with final docs (preserves list order & animations)
        for (const finalDoc of result.success) {
          const tempDoc = tempDocs.find((d) => d.fileName === finalDoc.fileName);
          if (tempDoc) {
            replaceDocument(tempDoc.id, finalDoc);
          } else {
            addDocument(finalDoc);
          }
        }

        // Mark failed uploads
        for (const failed of result.failed) {
          updateDocument(failed.id, { status: "error" });
        }

        if (result.failed.length > 0) {
          setGlobalError(t("steps.documents.filesFailed", { count: result.failed.length }));
        }
      } catch {
        // Mark all temp docs as error on unexpected failure
        for (const tempDoc of tempDocs) {
          updateDocument(tempDoc.id, { status: "error" });
        }
        setGlobalError(t("steps.documents.uploadFailed"));
      } finally {
        setApiBusy(false);
      }
    },
    [selectedType, addDocument, updateDocument, replaceDocument, setApiBusy, t]
  );

  const handleDelete = async (doc: DraftDocument) => {
    if (doc.status === "done") {
      try {
        await removeVendorDocument(doc.id);
      } catch {
        // Continue to remove from local state even if API fails
      }
    }
    removeDocument(doc.id);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    void handleFiles(e.dataTransfer.files);
  };

  const canContinue = doneDocs.length > 0 && uploadingDocs.length === 0;

  const onContinue = () => {
    if (!canContinue) return;
    setStep(3);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Document type selector */}
      <div className="flex flex-wrap gap-2">
        {documentTypes.map((dt) => (
          <button
            key={dt.value}
            type="button"
            onClick={() => setSelectedType(dt.value)}
            className={cn(
              "relative rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              selectedType === dt.value
                ? "border-primary bg-primary/15 text-primary"
                : "border-border/60 bg-card/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            {dt.label}
            {selectedType === dt.value && (
              <motion.span
                layoutId="doc-type-pill"
                className="absolute inset-0 rounded-full border border-primary/40"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
          </button>
        ))}
      </div>

      <p className="text-muted-foreground text-xs">
        {documentTypes.find((d) => d.value === selectedType)?.description}
      </p>

      {/* Upload zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-all",
          dragActive
            ? "border-primary bg-primary/10"
            : "border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/70"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10">
          <UploadCloud className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
        </div>
        <p className="text-sm font-medium">{t("steps.documents.clickOrDrag")}</p>
        <p className="text-muted-foreground text-xs">{t("steps.documents.fileTypes")}</p>
      </div>

      {globalError && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-destructive text-xs"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {globalError}
        </motion.div>
      )}

      {/* Document list */}
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {documents.map((doc) => {
            const Icon = fileIconFromMime(doc.mimeType);
            return (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3",
                  doc.status === "error"
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-border/60 bg-card/50"
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{doc.fileName}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {documentTypes.find((d) => d.value === doc.type)?.label}
                    </Badge>
                  </div>
                  {doc.status === "uploading" && (
                    <div className="flex items-center gap-2">
                      <Progress value={doc.progress ?? 0} className="h-1.5 flex-1" />
                      <span className="text-muted-foreground text-[10px]">{doc.progress ?? 0}%</span>
                    </div>
                  )}
                  {doc.status === "done" && (
                    <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                      <CheckCircle2 className="h-3 w-3" /> {t("steps.documents.uploaded")}
                    </span>
                  )}
                  {doc.status === "error" && (
                    <span className="flex items-center gap-1 text-destructive text-[10px]">
                      <XCircle className="h-3 w-3" /> {t("steps.documents.failed")}
                    </span>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => void handleDelete(doc)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {documents.length === 0 && (
          <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border/40 py-6 text-muted-foreground text-xs">
            <FileText className="h-5 w-5 opacity-40" />
            <p>{t("steps.documents.noDocuments")}</p>
            <p className="text-[10px] opacity-60">{t("steps.documents.atLeastOneRequired")}</p>
          </div>
        )}
      </div>

      {/* Continue button override — we need a custom submit here since documents are not a form */}
      <input type="hidden" form={ONBOARDING_STEP_FORM_ID} />
      <Button
        type="button"
        form={ONBOARDING_STEP_FORM_ID}
        disabled={!canContinue}
        onClick={onContinue}
        className="mt-2 w-full sm:w-auto sm:self-end"
      >
        {uploadingDocs.length > 0 ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("steps.documents.uploading")}
          </span>
        ) : (
          t("steps.documents.continue")
        )}
      </Button>
    </div>
  );
}
