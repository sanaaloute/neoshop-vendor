import { vendorApiClient } from "@/services/api/client";

/** Multipart uploads can exceed the default Axios timeout (30s) on slow links or large batches. */
const STORAGE_REQUEST_TIMEOUT_MS = 120_000;

/** POST /storage/upload — multipart; requires `storage.manage` on gateway. */
export async function uploadStorageObject(params: {
  file: File;
  bucket: string;
  entityId: string;
  type: string;
  subEntityId?: string;
}) {
  const form = new FormData();
  form.append("file", params.file);
  form.append("bucket", params.bucket);
  form.append("entityId", params.entityId);
  form.append("type", params.type);
  if (params.subEntityId) {
    form.append("subEntityId", params.subEntityId);
  }
  const { data } = await vendorApiClient.post<{ path: string; publicUrl?: string }>(
    "/api/v1/storage/upload",
    form,
    { timeout: STORAGE_REQUEST_TIMEOUT_MS }
  );
  return data;
}

/** POST /storage/upload/batch — multipart: repeated `files`, `types` as JSON array string (see STORAGE_API.md §10.2). */
export async function uploadStorageBatch(params: {
  files: File[];
  bucket: string;
  entityId: string;
  types: string[];
  subEntityId?: string;
}) {
  const form = new FormData();
  for (const file of params.files) {
    form.append("files", file);
  }
  form.append("bucket", params.bucket);
  form.append("entityId", params.entityId);
  form.append("types", JSON.stringify(params.types));
  if (params.subEntityId) {
    form.append("subEntityId", params.subEntityId);
  }
  const { data } = await vendorApiClient.post<{
    results: Array<{
      index: number;
      bucket: string;
      path: string;
      publicUrl?: string;
      error?: string;
    }>;
  }>("/api/v1/storage/upload/batch", form, { timeout: STORAGE_REQUEST_TIMEOUT_MS });
  return data;
}

/** POST /storage/read-urls — resolve public or signed URLs for uploaded paths. */
export async function readStorageUrls(
  items: { bucket: string; path: string }[]
) {
  const { data } = await vendorApiClient.post<{
    expiresIn: number;
    results: Array<{
      bucket: string;
      path: string;
      publicUrl?: string;
      signedUrl?: string;
      error?: string;
    }>;
  }>("/api/v1/storage/read-urls", { items }, { timeout: STORAGE_REQUEST_TIMEOUT_MS });
  return data;
}

/** GET /storage/signed-url — get a one-off signed URL for a private object. */
export async function getSignedStorageUrl(params: {
  bucket: string;
  path: string;
  expiresIn?: number;
}) {
  const { data } = await vendorApiClient.get<{ signedUrl: string; expiresIn: number }>(
    "/api/v1/storage/signed-url",
    { params }
  );
  return data;
}

/** DELETE /storage — delete a stored object. */
export async function deleteStorageObject(body: { bucket: string; path: string }) {
  await vendorApiClient.delete("/api/v1/storage", { data: body });
}
