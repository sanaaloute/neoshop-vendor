"use client";

import { useCallback, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  deleteStorageObject,
  getSignedStorageUrl,
  readStorageUrls,
  uploadStorageBatch,
  uploadStorageObject,
} from "@/services/vendor/storage-api";

export function useStorageUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async <T>(fn: () => Promise<T>, fallbackMessage: string): Promise<T> => {
    if (!getApiBaseUrl()) throw new Error("gateway_not_configured");
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      const msg = httpErrorMessageForUser(e, fallbackMessage);
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const upload = useCallback(
    async (params: {
      file: File;
      bucket: string;
      entityId: string;
      type: string;
      subEntityId?: string;
    }) => {
      return run(
        () => uploadStorageObject(params),
        "Could not upload file."
      );
    },
    []
  );

  const uploadBatch = useCallback(
    async (params: {
      files: File[];
      bucket: string;
      entityId: string;
      types: string[];
      subEntityId?: string;
    }) => {
      return run(
        () => uploadStorageBatch(params),
        "Could not upload files."
      );
    },
    []
  );

  const readUrls = useCallback(
    async (items: { bucket: string; path: string }[]) => {
      return run(() => readStorageUrls(items), "Could not resolve URLs.");
    },
    []
  );

  const signedUrl = useCallback(
    async (bucket: string, path: string) => {
      return run(
        () => getSignedStorageUrl({ bucket, path }),
        "Could not get signed URL."
      );
    },
    []
  );

  const remove = useCallback(async (bucket: string, path: string) => {
    return run(() => deleteStorageObject({ bucket, path }), "Could not delete file.");
  }, []);

  return {
    loading,
    error,
    upload,
    uploadBatch,
    readUrls,
    signedUrl,
    remove,
  };
}
