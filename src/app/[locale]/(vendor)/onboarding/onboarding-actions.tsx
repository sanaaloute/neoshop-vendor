"use client";

import { useRouter } from "@/i18n/routing";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function OnboardingActions() {
  const router = useRouter();
  const { logout } = useAuth();

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
        Sign out
      </Button>
    </div>
  );
}
