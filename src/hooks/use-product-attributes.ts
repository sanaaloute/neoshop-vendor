"use client";

import { useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  deleteProductAttribute,
  deleteProductAttributeValue,
} from "@/services/vendor/products-api";

function isUuidV4(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  );
}

/** Delete product attributes and attribute values. */
export function useProductAttributes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeAttribute = useCallback(
    async (productId: string, attributeId: string) => {
      if (!getApiBaseUrl()) return;
      if (!isUuidV4(attributeId)) {
        setError("Attribute has not been synced to the backend yet.");
        return;
      }
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
      if (!isUuidV4(attributeId) || !isUuidV4(valueId)) {
        setError("Attribute or value has not been synced to the backend yet.");
        return;
      }
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
