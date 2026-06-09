import type { ProductFormValues } from "./types";

export function emptyProductFormValues(): ProductFormValues {
  return {
    name: "",
    description: "",
    price: 9.99,
    categoryIds: [],
    tags: [],
    seo: { slug: "", metaTitle: "", metaDescription: "" },
    media: [],
    status: "draft",
    publishAt: null,
  };
}
