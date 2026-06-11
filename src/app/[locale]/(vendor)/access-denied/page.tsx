import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AccessDeniedContent } from "./access-denied-content";

export default async function AccessDeniedPage() {
  const t = await getTranslations("common");
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground px-4 py-16 text-center text-sm">
          {t("loading")}
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
