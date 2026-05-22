import { vendorApiClient } from "@/services/api/client";

export type Category = {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
};

/** GET /categories — public reference tree */
export async function getCategoryTree() {
  const { data } = await vendorApiClient.get<Category[]>("/api/v1/categories");
  return data;
}
