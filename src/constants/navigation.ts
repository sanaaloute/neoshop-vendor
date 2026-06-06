import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import type { VendorPermission } from "@/lib/vendor-permissions";
import {
  Bell,
  HelpCircle,
  LayoutDashboard,
  Layers,
  LineChart,
  MessageSquare,
  Package,
  Scale,
  ShoppingCart,
  Star,
  Store,
  UserCog,
  Users,
  Warehouse,
  Wallet,
} from "lucide-react";

export type VendorNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** When set, link is shown only if the member has this vendor permission */
  permission?: VendorPermission;
};

export function useVendorMainNav(): VendorNavItem[] {
  const t = useTranslations("navigation");

  return [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    {
      href: "/products",
      label: t("products"),
      icon: Package,
      permission: "products",
    },
    {
      href: "/variants",
      label: t("variants"),
      icon: Layers,
      permission: "products",
    },
    {
      href: "/inventory",
      label: t("inventory"),
      icon: Warehouse,
      permission: "products",
    },
    {
      href: "/orders",
      label: t("orders"),
      icon: ShoppingCart,
      permission: "orders",
    },
    { href: "/customers", label: t("customers"), icon: Users },
    { href: "/reviews", label: t("reviews"), icon: Star },
    { href: "/product-qa", label: t("qa"), icon: HelpCircle },
    {
      href: "/analytics",
      label: t("analytics"),
      icon: LineChart,
      permission: "analytics",
    },
    {
      href: "/disputes",
      label: t("disputes"),
      icon: Scale,
      permission: "orders",
    },
    {
      href: "/payouts",
      label: t("payouts"),
      icon: Wallet,
      permission: "payouts",
    },
    {
      href: "/chat",
      label: t("messages"),
      icon: MessageSquare,
      permission: "chat",
    },
    { href: "/shop", label: t("shopSettings"), icon: Store },
    { href: "/notifications", label: t("notifications"), icon: Bell },
    { href: "/settings", label: t("accountSettings"), icon: UserCog },
  ];
}

export function labelForPathSegment(segment: string, t?: (key: string) => string) {
  // Try to map common segments to translation keys
  const keyMap: Record<string, string> = {
    dashboard: "dashboard",
    products: "products",
    variants: "variants",
    inventory: "inventory",
    orders: "orders",
    customers: "customers",
    reviews: "reviews",
    "product-qa": "qa",
    analytics: "analytics",
    disputes: "disputes",
    payouts: "payouts",
    chat: "messages",
    shop: "shopSettings",
    notifications: "notifications",
    settings: "accountSettings",
  };

  const key = keyMap[segment];
  if (key && t) {
    return t(key);
  }

  return formatSegment(segment);
}

function formatSegment(segment: string) {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
