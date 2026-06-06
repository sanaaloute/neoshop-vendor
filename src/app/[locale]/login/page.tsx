import { Suspense } from "react";
import { useTranslations } from "next-intl";

import { LoadingState } from "@/components/layout/loading-state";

import { LoginForm } from "./login-form";

export default function LoginRoutePage() {
  const t = useTranslations("auth");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Suspense
        fallback={
          <LoadingState
            label={t("openingSignIn")}
            rows={2}
            className="max-w-md"
          />
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
