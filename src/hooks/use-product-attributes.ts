"use client";

import { useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  deleteProductAttribute,
  deleteProductAttributeValue,
} from "@/services/vendor/products-api";

/** Delete product attributes and attribute values. */
export function useProductAttributes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeAttribute = useCallback(
    async (productId: string, attributeId: string) => {
      if (!getApiBaseUrl()) return;
      setLoading(true);
      setError(null);
      try {
        await deleteProductAttribute(productId, attributeId);
      } catch (e) {
        setError(
          httpErrorMessageForUser(e, "Could not delete product attribute.")
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const removeAttributeValue = useCallback(
    async (productId: string, attributeId: string, valueId: string) => {
      if (!getApiBaseUrl()) return;
      setLoading(true);
      setError(null);
      try {
        await deleteProductAttributeValue(productId, attributeId, valueId);
      } catch (e) {
        setError(
          httpErrorMessageForUser(
            e,
            "Could not delete attribute value. It may be in use by a variant."
          )
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { removeAttribute, removeAttributeValue, loading, error };
}
