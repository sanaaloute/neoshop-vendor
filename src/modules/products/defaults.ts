import type { ProductFormValues } from "./types";

export function emptyProductFormValues(): ProductFormValues {
  return {
    name: "",
    description: "",
    moq: 1,
    bulkPricing: [],
    categoryIds: [],
    seo: { slug: "" },
    media: [],
    status: "draft",
    publishAt: null,
  };
}
