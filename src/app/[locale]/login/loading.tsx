import { getTranslations } from "next-intl/server";

import { LoadingState } from "@/components/layout/loading-state";

export default async function LoginLoading() {
  const t = await getTranslations("loading");
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <LoadingState
        label={t("openingSignIn")}
        rows={2}
        className="w-full max-w-sm"
        showSpinner
      />
    </div>
  );
}
