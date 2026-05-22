import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { NotificationsHome } from "@/modules/notifications";

export default function NotificationsRoutePage() {
  return (
    <FeaturePageShell title="Notifications" className="max-w-6xl">
      <NotificationsHome />
    </FeaturePageShell>
  );
}
