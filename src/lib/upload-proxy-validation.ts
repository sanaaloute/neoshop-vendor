import {
  UPLOAD_BUCKETS,
  validateFileAgainstConfig,
  validateChatAttachment,
} from "./upload-config";

export type UploadValidationError = {
  error: string;
  message: string;
};

function error(message: string): UploadValidationError {
  return { error: "upload_validation_failed", message };
}

function validateStorageFiles(
  files: File[],
  bucket: string | null
): UploadValidationError | null {
  if (!bucket) {
    return error("Missing storage bucket.");
  }
  const config = UPLOAD_BUCKETS[bucket];
  if (!config) {
    return error(`Unsupported storage bucket: ${bucket}.`);
  }
  if (config.maxFiles !== undefined && files.length > config.maxFiles) {
    return error(
      `Too many files (${files.length}; max ${config.maxFiles} for ${bucket}).`
    );
  }
  for (const file of files) {
    const msg = validateFileAgainstConfig(file, config);
    if (msg) return error(`${file.name}: ${msg}`);
  }
  return null;
}

export function validateMultipartUpload(
  pathname: string,
  formData: FormData
): UploadValidationError | null {
  // Single storage upload: POST /api/v1/storage/upload
  if (pathname === "/api/v1/storage/upload") {
    const file = formData.get("file");
    const bucket = formData.get("bucket");
    if (!(file instanceof File)) {
      return error("Missing file.");
    }
    return validateStorageFiles([file], typeof bucket === "string" ? bucket : null);
  }

  // Batch storage upload: POST /api/v1/storage/upload/batch
  if (pathname === "/api/v1/storage/upload/batch") {
    const files = formData.getAll("files");
    const bucket = formData.get("bucket");
    if (!files.length) {
      return error("Missing files.");
    }
    if (!files.every((f) => f instanceof File)) {
      return error("Invalid files.");
    }
    return validateStorageFiles(
      files as File[],
      typeof bucket === "string" ? bucket : null
    );
  }

  // Chat attachment upload: POST /api/v1/chat/conversations/:id/attachments
  if (
    pathname.startsWith("/api/v1/chat/conversations/") &&
    pathname.endsWith("/attachments")
  ) {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return error("Missing file.");
    }
    const msg = validateChatAttachment(file);
    if (msg) return error(`${file.name}: ${msg}`);
    return null;
  }

  return null;
}
