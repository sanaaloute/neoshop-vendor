"use client";

import { useRouter } from "@/i18n/routing";
import { ClipboardList, Plus, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useVendorPermissions } from "@/hooks/use-vendor-permissions";

export function VendorQuickActions({ className }: { className?: string }) {
  const router = useRouter();
  const { can } = useVendorPermissions();
  const t = useTranslations("navigation");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="sm" className={cn("gap-1.5", className)}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t("quickActions")}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs">
          {t("createAndImport")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {can("products") ? (
          <>
            <DropdownMenuItem onClick={() => router.push("/products")}>
              <Plus className="size-4" />
              {t("newProduct")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/products")}>
              <Upload className="size-4" />
              {t("bulkImport")}
            </DropdownMenuItem>
          </>
        ) : null}
        {can("orders") ? (
          <DropdownMenuItem onClick={() => router.push("/orders")}>
            <ClipboardList className="size-4" />
            {t("reviewOrders")}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
