import type { LucideIcon } from "lucide-react";

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

export const VENDOR_MAIN_NAV: VendorNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/products",
    label: "Products",
    icon: Package,
    permission: "products",
  },
  {
    href: "/variants",
    label: "Variants",
    icon: Layers,
    permission: "products",
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: Warehouse,
    permission: "products",
  },
  {
    href: "/orders",
    label: "Orders",
    icon: ShoppingCart,
    permission: "orders",
  },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/product-qa", label: "Q&A", icon: HelpCircle },
  {
    href: "/analytics",
    label: "Analytics",
    icon: LineChart,
    permission: "analytics",
  },
  {
    href: "/disputes",
    label: "Disputes",
    icon: Scale,
    permission: "orders",
  },
  {
    href: "/payouts",
    label: "Payouts",
    icon: Wallet,
    permission: "payouts",
  },
  {
    href: "/chat",
    label: "Messages",
    icon: MessageSquare,
    permission: "chat",
  },
  { href: "/shop", label: "Shop Settings", icon: Store },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Account Settings", icon: UserCog },
];

const NAV_LABEL_BY_SEGMENT: Record<string, string> = Object.fromEntries(
  VENDOR_MAIN_NAV.map((item) => {
    const seg = item.href.replace(/^\//, "").split("/")[0] ?? "";
    return [seg, item.label];
  })
);

export function labelForPathSegment(segment: string) {
  return NAV_LABEL_BY_SEGMENT[segment] ?? formatSegment(segment);
}

function formatSegment(segment: string) {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
