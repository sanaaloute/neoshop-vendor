import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { SettingsHome } from "@/modules/settings";

export default function SettingsRoutePage() {
  return (
    <FeaturePageShell title="Settings" className="max-w-6xl">
      <SettingsHome />
    </FeaturePageShell>
  );
}
