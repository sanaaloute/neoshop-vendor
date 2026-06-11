"use client";

import { useParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const localeCodes = ["en", "fr", "zh"] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const t = useTranslations("language");

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn("text-muted-foreground", className)}
            aria-label={t("switcherLabel")}
            title={t("switcherLabel")}
          >
            <Globe className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {localeCodes.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchLocale(loc)}
            className={cn(
              "cursor-pointer",
              locale === loc && "bg-primary/10 font-medium"
            )}
          >
            {t(loc)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
