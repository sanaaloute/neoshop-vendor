import { z } from "zod";

const seoSchema = z.object({
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lowercase letters, numbers, and single hyphens only"
    ),
});

const mediaRowSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  sortIndex: z.number(),
});

const bulkPricingTierSchema = z.object({
  minQuantity: z.number().min(1, "Min quantity must be at least 1"),
  unitPrice: z.number().positive("Unit price must be greater than zero"),
});

export const productFormSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    description: z.string().min(10, "Add a short description (min 10 chars)"),
    moq: z.number().min(1, "MOQ must be at least 1"),
    currency: z.enum(["CNY", "XOF"]),
    bulkPricing: z.array(bulkPricingTierSchema),
    categoryIds: z.array(z.string()).min(1, "Pick at least one category"),
    seo: seoSchema,
    media: z.array(mediaRowSchema),
    status: z.enum([
      "draft",
      "published",
      "archived",
      "pending_review",
      "hidden",
      "rejected",
    ]),
    publishAt: z.string().nullable(),
  });

export type ProductFormSchemaIn = z.infer<typeof productFormSchema>;
