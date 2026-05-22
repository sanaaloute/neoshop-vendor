import { z } from "zod";

export const businessSchema = z.object({
  legalName: z.string().min(2, "Legal name is required"),
  registrationId: z.string().min(2, "Registration / EIN is required"),
  country: z.string().min(2, "Country is required"),
  addressLine1: z.string().min(4, "Street address is required"),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().min(2, "Postal code is required"),
  businessEmail: z.string().email("Enter a valid business email"),
  businessPhone: z
    .string()
    .min(6, "Business phone is required")
    .max(32, "Use at most 32 characters"),
});

export const shopSchema = z.object({
  shopName: z.string().min(2, "Shop display name is required"),
  description: z.string().min(20, "Add at least 20 characters"),
  website: z
    .string()
    .refine(
      (v) => !v.trim() || /^https?:\/\/.+/i.test(v.trim()),
      "Use a full http(s) URL or leave empty"
    ),
});

export const documentsSchema = z
  .object({
    docTypes: z.array(z.string()).min(1, "Select at least one document type"),
    notes: z.string().max(500),
    fileNames: z.array(z.string()),
    fileUrls: z.array(z.string()),
  })
  .superRefine((val, ctx) => {
    if (val.fileUrls.length !== val.docTypes.length) {
      ctx.addIssue({
        code: "custom",
        message:
          "Enter exactly one HTTPS URL per selected document type (same order as the chips above).",
        path: ["fileUrls"],
      });
      return;
    }
    for (const raw of val.fileUrls) {
      const url = raw.trim();
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:") {
          ctx.addIssue({
            code: "custom",
            message: "Document links must use https://",
            path: ["fileUrls"],
          });
          return;
        }
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "Each document URL must be a valid https:// link",
          path: ["fileUrls"],
        });
        return;
      }
    }
  });

export const shippingSchema = z.object({
  originCountry: z.string().min(2, "Origin country is required"),
  carrier: z.string().min(2, "Preferred carrier is required"),
  processingDays: z.number().min(1, "At least 1 day").max(60, "Max 60 days"),
});

export const paymentSchema = z.object({
  accountHolder: z.string().min(2, "Account holder is required"),
  bankName: z.string().min(2, "Bank name is required"),
  ibanLast4: z
    .string()
    .length(4, "Last 4 digits")
    .regex(/^\d{4}$/, "Digits only"),
  routingHint: z.string().min(4, "Routing / SWIFT reference"),
});

export const taxSchema = z.object({
  entityType: z.enum(["company", "individual"]),
  vatId: z.string().min(4, "VAT / GST ID"),
  taxId: z.string().min(4, "Tax ID"),
});

export const reviewSchema = z.object({
  acceptedTerms: z.boolean().refine((v) => v === true, {
    message: "Accept terms to submit",
  }),
});

export const onboardingStepSchemas = [
  businessSchema,
  shopSchema,
  documentsSchema,
  shippingSchema,
  paymentSchema,
  taxSchema,
  reviewSchema,
] as const;

export type OnboardingStepSchema = (typeof onboardingStepSchemas)[number];
