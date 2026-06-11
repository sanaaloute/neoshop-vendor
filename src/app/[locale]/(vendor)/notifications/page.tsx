import { getTranslations } from "next-intl/server";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { NotificationsHome } from "@/modules/notifications";

export default async function NotificationsRoutePage() {
  const t = await getTranslations("navigation");
  return (
    <FeaturePageShell title={t("notifications")} className="max-w-6xl">
      <NotificationsHome />
    </FeaturePageShell>
  );
}
