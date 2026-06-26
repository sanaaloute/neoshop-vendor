"use client";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/routing";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function OnboardingActions() {
  const router = useRouter();
  const { logout } = useAuth();
  const t = useTranslations("navigation");

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={async () => {
          await logout();
          router.replace("/login");
        }}
      >
        {t("logOut")}
      </Button>
    </div>
  );
}
