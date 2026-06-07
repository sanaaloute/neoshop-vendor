"use client";

import { useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  getSignedStorageUrl,
  deleteStorageObject,
} from "@/services/vendor/storage-api";

/** Signed-URL retrieval and object deletion for vendor storage. */
export function useStorageUtils() {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSignedUrl = useCallback(
    async (bucket: string, path: string, expiresIn?: number) => {
      if (!getApiBaseUrl()) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getSignedStorageUrl({ bucket, path, expiresIn });
        setSignedUrl(data.signedUrl);
        return data.signedUrl;
      } catch (e) {
        setError(httpErrorMessageForUser(e, "Could not get signed URL."));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const removeObject = useCallback(
    async (bucket: string, path: string) => {
      if (!getApiBaseUrl()) return;
      setLoading(true);
      setError(null);
      try {
        await deleteStorageObject({ bucket, path });
      } catch (e) {
        setError(httpErrorMessageForUser(e, "Could not delete object."));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { signedUrl, loading, error, fetchSignedUrl, removeObject };
}
