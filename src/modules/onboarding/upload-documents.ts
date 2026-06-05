import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  readStorageUrls,
  uploadStorageBatch,
} from "@/services/vendor/storage-api";
import { getVendorMe } from "@/services/vendor/vendors-api";

/** Must match `StorageBucket` in the API (`STORAGE_API.md` §5). */
const VENDOR_DOCUMENTS_BUCKET = "vendor-documents";

export type VendorOnboardingUploadProgress = {
  index: number;
  total: number;
  fileName: string;
  phase: "start" | "done" | "error";
  errorMessage?: string;
};

function assertVendorId(vendor: unknown): string {
  if (
    vendor &&
    typeof vendor === "object" &&
    "id" in vendor &&
    typeof (vendor as { id: unknown }).id === "string"
  ) {
    return (vendor as { id: string }).id;
  }
  throw new Error(
    "Vendor profile not found. Complete the business step and try again."
  );
}

/** Upload KYC files via the API gateway (Storage module), not direct Supabase. */
export async function uploadVendorOnboardingFiles(
  files: File[],
  onProgress?: (p: VendorOnboardingUploadProgress) => void
): Promise<{ urls: string[]; names: string[]; items: { bucket: string; path: string }[] }> {
  if (files.length === 0) {
    return { urls: [], names: [], items: [] };
  }

  const vendor = await getVendorMe();
  const vendorId = assertVendorId(vendor);

  const names = files.map((f) => f.name);
  const total = files.length;
  const types = files.map((_, i) => `kyc_${i}`);

  for (let i = 0; i < total; i++) {
    onProgress?.({
      index: i,
      total,
      fileName: files[i]!.name,
      phase: "start",
    });
  }

  let uploadResults: Awaited<ReturnType<typeof uploadStorageBatch>>;
  try {
    uploadResults = await uploadStorageBatch({
      files,
      bucket: VENDOR_DOCUMENTS_BUCKET,
      entityId: vendorId,
      types,
    });
  } catch (e) {
    const msg = httpErrorMessageForUser(e, "Upload failed. Try again.");
    for (let i = 0; i < total; i++) {
      onProgress?.({
        index: i,
        total,
        fileName: files[i]!.name,
        phase: "error",
        errorMessage: msg,
      });
    }
    throw new Error(msg);
  }

  const sorted = [...uploadResults.results].sort((a, b) => a.index - b.index);
  const stored: { bucket: string; path: string }[] = [];

  for (const r of sorted) {
    const fileName = names[r.index] ?? `file_${r.index}`;
    if (r.error || !r.path) {
      const msg = r.error || "Upload failed";
      onProgress?.({
        index: r.index,
        total,
        fileName,
        phase: "error",
        errorMessage: msg,
      });
      throw new Error(msg);
    }
    onProgress?.({
      index: r.index,
      total,
      fileName,
      phase: "done",
    });
    stored.push({ bucket: r.bucket, path: r.path });
  }

  let batch: Awaited<ReturnType<typeof readStorageUrls>>;
  try {
    batch = await readStorageUrls(stored);
  } catch (e) {
    const msg = httpErrorMessageForUser(
      e,
      "Could not prepare file links. Try again."
    );
    throw new Error(msg);
  }

  const urls: string[] = [];
  for (let i = 0; i < batch.results.length; i++) {
    const row = batch.results[i]!;
    const url = row.publicUrl ?? row.signedUrl;
    if (!url || row.error) {
      throw new Error(
        row.error ||
          `Could not resolve a URL for ${names[i] ?? "file"} (${row.path}).`
      );
    }
    urls.push(url);
  }

  return { urls, names, items: stored };
}
