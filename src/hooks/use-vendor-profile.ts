"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  deleteVendorDocument,
  getVendorMe,
  patchVendorOnboarding,
  postVendorDocument,
  submitVendorVerification,
} from "@/services/vendor/vendors-api";
import type {
  CreateVendorDocumentDto,
  UpdateVendorOnboardingDto,
  VendorMeResponse,
} from "@/services/vendor/types";

export function useVendorProfile() {
  const [vendor, setVendor] = useState<VendorMeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getVendorMe();
      setVendor(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load vendor profile."));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOnboarding = useCallback(async (body: UpdateVendorOnboardingDto) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await patchVendorOnboarding(body);
      setVendor(data as VendorMeResponse);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not update onboarding."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const addDocument = useCallback(async (body: CreateVendorDocumentDto) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      await postVendorDocument(body);
      await refetch();
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not add document."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [refetch]);

  const removeDocument = useCallback(async (documentId: string) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      await deleteVendorDocument(documentId);
      await refetch();
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not remove document."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [refetch]);

  const submitVerification = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await submitVendorVerification();
      setVendor(data as VendorMeResponse);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not submit verification."));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    vendor,
    loading,
    error,
    refetch,
    updateOnboarding,
    addDocument,
    removeDocument,
    submitVerification,
  };
}
