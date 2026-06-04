import { z } from "zod";

export const basicInfoSchema = z.object({
  vendorType: z.enum(["INDIVIDUAL", "COMPANY"]),
  legalBusinessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(120, "Business name must be under 120 characters"),
  tradeName: z.string().max(120, "Trade name must be under 120 characters").optional().or(z.literal("")),
  businessEmail: z
    .string()
    .min(1, "Business email is required")
    .email("Enter a valid email address"),
  businessPhone: z
    .string()
    .min(6, "Phone number is too short")
    .max(32, "Phone number is too long"),
  countryCode: z.string().min(1, "Please select a country"),
});

export const addressInfoSchema = z.object({
  region: z.string().max(100).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  addressLine1: z
    .string()
    .min(3, "Address is required")
    .max(200, "Address is too long"),
  postalCode: z.string().max(30).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  acceptedTerms: z.boolean().refine((v: boolean) => v === true, {
    message: "You must confirm the information is accurate",
  }),
});

export type BasicInfoSchema = z.infer<typeof basicInfoSchema>;
export type AddressInfoSchema = z.infer<typeof addressInfoSchema>;
export type ReviewSchema = z.infer<typeof reviewSchema>;
