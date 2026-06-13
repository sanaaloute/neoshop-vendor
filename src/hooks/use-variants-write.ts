"use client";

import { useCallback, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  createVariant,
  createVariantsBulk,
  deleteVariant,
  deleteVariantsBulk,
  updateVariant,
  updateVariantsBulk,
} from "@/services/vendor/variants-api";
import type {
  BulkCreateVariantsDto,
  BulkDeleteVariantsDto,
  BulkUpdateVariantsDto,
  CreateVariantDto,
  UpdateVariantDto,
} from "@/services/vendor/types";

export function useVariantsWrite() {
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

  const create = useCallback((productId: string, body: CreateVariantDto) => {
    return run(() => createVariant(productId, body), "Could not create variant.");
  }, []);

  const createBulk = useCallback((productId: string, body: BulkCreateVariantsDto) => {
    return run(() => createVariantsBulk(productId, body), "Could not create variants.");
  }, []);

  const update = useCallback(
    (productId: string, variantId: string, body: UpdateVariantDto) => {
      return run(
        () => updateVariant(productId, variantId, body),
        "Could not update variant."
      );
    },
    []
  );

  const updateBulk = useCallback((productId: string, body: BulkUpdateVariantsDto) => {
    return run(() => updateVariantsBulk(productId, body), "Could not update variants.");
  }, []);

  const remove = useCallback((productId: string, variantId: string) => {
    return run(() => deleteVariant(productId, variantId), "Could not delete variant.");
  }, []);

  const removeBulk = useCallback((productId: string, body: BulkDeleteVariantsDto) => {
    return run(() => deleteVariantsBulk(productId, body), "Could not delete variants.");
  }, []);

  return {
    loading,
    error,
    create,
    createBulk,
    update,
    updateBulk,
    remove,
    removeBulk,
  };
}
