/** Shared upload constraints used by client validators and the API proxy. */

export type UploadBucketConfig = {
  maxFileSize: number;
  allowedMimeTypes: string[];
  maxFiles?: number;
};

export const UPLOAD_BUCKETS: Record<string, UploadBucketConfig> = {
  "product-media": {
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ],
    maxFiles: 40,
  },
  "vendor-documents": {
    maxFileSize: 12 * 1024 * 1024, // 12 MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ],
    maxFiles: 20,
  },
};

export const CHAT_ATTACHMENT_LIMITS = {
  image: {
    maxFileSize: 1 * 1024 * 1024, // 1 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  document: {
    maxFileSize: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ["application/pdf"],
  },
};

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function validateFileAgainstConfig(
  file: File,
  config: UploadBucketConfig
): string | null {
  if (!config.allowedMimeTypes.includes(file.type)) {
    return `Unsupported file type: ${file.type || "unknown"}`;
  }
  if (file.size > config.maxFileSize) {
    return `File too large (${formatSize(file.size)}; max ${formatSize(
      config.maxFileSize
    )})`;
  }
  return null;
}

export function validateChatAttachment(file: File): string | null {
  if (file.type === "application/pdf") {
    return validateFileAgainstConfig(file, {
      maxFileSize: CHAT_ATTACHMENT_LIMITS.document.maxFileSize,
      allowedMimeTypes: CHAT_ATTACHMENT_LIMITS.document.allowedMimeTypes,
    });
  }
  return validateFileAgainstConfig(file, {
    maxFileSize: CHAT_ATTACHMENT_LIMITS.image.maxFileSize,
    allowedMimeTypes: CHAT_ATTACHMENT_LIMITS.image.allowedMimeTypes,
  });
}
