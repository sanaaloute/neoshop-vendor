import { z } from "zod";

const seoSchema = z.object({
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lowercase letters, numbers, and single hyphens only"
    ),
  metaTitle: z.string().min(4, "Meta title is required").max(70),
  metaDescription: z.string().min(10, "Meta description is required").max(320),
});

const mediaRowSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  sortIndex: z.number(),
});

export const productFormSchema = z
  .object({
    sku: z.string(),
    name: z.string().min(2, "Name is required"),
    description: z.string().min(10, "Add a short description (min 10 chars)"),
    price: z.number().positive("Price must be greater than zero"),
    categoryIds: z.array(z.string()).min(1, "Pick at least one category"),
    tags: z.array(z.string()),
    seo: seoSchema,
    media: z.array(mediaRowSchema),
    status: z.enum([
      "draft",
      "published",
      "scheduled",
      "archived",
      "pending_review",
      "hidden",
      "rejected",
    ]),
    publishAt: z.string().nullable(),
    configureVariants: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "scheduled") {
      if (!data.publishAt || !data.publishAt.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pick a publish date and time",
          path: ["publishAt"],
        });
      }
    }
  });

export type ProductFormSchemaIn = z.infer<typeof productFormSchema>;
