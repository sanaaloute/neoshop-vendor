"use client";

import { useRouter } from "@/i18n/routing";
import { LogOut, Settings, Store } from "lucide-react";
import { useTranslations } from "next-intl";

import { VendorMuted } from "@/components/layout/typography";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function VendorProfileMenu({ className }: { className?: string }) {
  const router = useRouter();
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const t = useTranslations("navigation");

  const initials =
    user?.email?.slice(0, 2).toUpperCase() ??
    user?.id?.slice(0, 2).toUpperCase() ??
    "V";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "border-border/80 from-primary/25 to-chart-2/20 text-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex size-9 items-center justify-center rounded-full border bg-gradient-to-br text-xs font-semibold transition-transform outline-none hover:scale-[1.02] focus-visible:ring-[3px]",
          className
        )}
        aria-label={t("accountSettings")}
      >
        {isLoading ? (
          <span className="bg-muted-foreground/40 size-3 rounded-full animate-pulse-soft" />
        ) : (
          initials
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-foreground text-sm font-medium">
            {t("vendorAccount")}
          </span>
          {user?.email ? (
            <VendorMuted className="truncate text-xs font-normal">
              {user.email}
            </VendorMuted>
          ) : null}
        </DropdownMenuLabel>
        {isAuthenticated ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="size-4" />
              {t("accountSettings")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/shop")}>
              <Store className="size-4" />
              {t("shopProfile")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
            >
              <LogOut className="size-4" />
              {t("logOut")}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.replace("/login")}>
              <LogOut className="size-4" />
              {t("logIn")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
