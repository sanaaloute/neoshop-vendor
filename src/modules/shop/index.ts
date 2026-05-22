/**
 * Shop settings — profile, branding, policies, business, verification, payout.
 * @module modules/shop
 */

export { ShopSettingsHome } from "./shop-settings-home";
export { getDefaultShopSettings } from "./defaults";
export {
  useShopSettingsStore,
  useShopSettingsHydrated,
} from "@/store/shop-settings-store";
export type {
  ShopSettingsState,
  ShopProfile,
  ShopBranding,
  ShippingRules,
  ReturnPolicy,
  BusinessDetails,
  VerificationState,
  PayoutSettings,
} from "./types";
