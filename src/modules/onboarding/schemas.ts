import { z } from "zod";

export function createBasicInfoSchema(t: (key: string) => string) {
  return z.object({
    vendorType: z.enum(["INDIVIDUAL", "COMPANY"]),
    legalBusinessName: z
      .string()
      .min(2, t("validation.businessNameMin"))
      .max(120, t("validation.businessNameMax")),
    tradeName: z.string().max(120, t("validation.tradeNameMax")).optional().or(z.literal("")),
    businessEmail: z
      .string()
      .min(1, t("validation.emailRequired"))
      .email(t("validation.emailInvalid")),
    businessPhone: z
      .string()
      .min(6, t("validation.phoneTooShort"))
      .max(32, t("validation.phoneTooLong")),
    countryCode: z.string().min(1, t("validation.countryRequired")),
  });
}

export function createAddressInfoSchema(t: (key: string) => string) {
  return z.object({
    region: z.string().max(100).optional().or(z.literal("")),
    city: z.string().max(100).optional().or(z.literal("")),
    addressLine1: z
      .string()
      .min(3, t("validation.addressRequired"))
      .max(200, t("validation.addressTooLong")),
    postalCode: z.string().max(30).optional().or(z.literal("")),
  });
}

export function createReviewSchema(t: (key: string) => string) {
  return z.object({
    acceptedTerms: z.boolean().refine((v: boolean) => v === true, {
      message: t("validation.termsRequired"),
    }),
  });
}

export type BasicInfoSchema = z.infer<ReturnType<typeof createBasicInfoSchema>>;
export type AddressInfoSchema = z.infer<ReturnType<typeof createAddressInfoSchema>>;
export type ReviewSchema = z.infer<ReturnType<typeof createReviewSchema>>;
