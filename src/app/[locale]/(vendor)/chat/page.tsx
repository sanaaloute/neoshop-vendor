import { getTranslations } from "next-intl/server";

import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { MessagingHome } from "@/modules/chat";

export default async function ChatRoutePage() {
  const t = await getTranslations("navigation");
  return (
    <FeaturePageShell title={t("messages")} className="max-w-6xl">
      <MessagingHome />
    </FeaturePageShell>
  );
}
