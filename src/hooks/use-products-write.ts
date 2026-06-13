"use client";

import { useCallback, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  attachProductMedia,
  createProduct,
  createProductAttribute,
  createProductAttributeValue,
  deleteProduct,
  deleteProductMedia,
  setProductCategories,
  updateProduct,
} from "@/services/vendor/products-api";
import type {
  AddAttributeValuesDto,
  CreateProductAttributeDto,
  CreateProductDto,
  UpdateProductDto,
} from "@/services/vendor/types";

export function useProductsWrite() {
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

  const create = useCallback((body: CreateProductDto) => {
    return run(() => createProduct(body), "Could not create product.");
  }, []);

  const update = useCallback((productId: string, body: UpdateProductDto) => {
    return run(() => updateProduct(productId, body), "Could not update product.");
  }, []);

  const remove = useCallback((productId: string) => {
    return run(() => deleteProduct(productId), "Could not delete product.");
  }, []);

  const setCategories = useCallback((productId: string, categoryIds?: string[]) => {
    return run(
      () => setProductCategories(productId, { categoryIds }),
      "Could not update categories."
    );
  }, []);

  const attachMedia = useCallback(
    (
      productId: string,
      body: {
        url: string;
        alt?: string;
        sortOrder?: number;
        isPrimary?: boolean;
        variantId?: string;
      }
    ) => {
      return run(() => attachProductMedia(productId, body), "Could not attach media.");
    },
    []
  );

  const removeMedia = useCallback((productId: string, mediaId: string) => {
    return run(() => deleteProductMedia(productId, mediaId), "Could not remove media.");
  }, []);

  const createAttribute = useCallback((productId: string, body: CreateProductAttributeDto) => {
    return run(
      () => createProductAttribute(productId, body),
      "Could not create attribute."
    );
  }, []);

  const createAttributeValues = useCallback(
    (productId: string, attributeId: string, body: AddAttributeValuesDto) => {
      return run(
        () => createProductAttributeValue(productId, attributeId, body),
        "Could not add attribute values."
      );
    },
    []
  );

  return {
    loading,
    error,
    create,
    update,
    remove,
    setCategories,
    attachMedia,
    removeMedia,
    createAttribute,
    createAttributeValues,
  };
}
