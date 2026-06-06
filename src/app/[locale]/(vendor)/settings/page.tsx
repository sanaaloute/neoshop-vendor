import { getTranslations } from "next-intl/server";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { SettingsHome } from "@/modules/settings/settings-home";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  return (
    <FeaturePageShell title={t("title")} description={t("description")}>
      <SettingsHome />
    </FeaturePageShell>
  );
}
