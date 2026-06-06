import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { MessagingHome } from "@/modules/chat";

export default function ChatRoutePage() {
  return (
    <FeaturePageShell title="Messages" className="max-w-6xl">
      <MessagingHome />
    </FeaturePageShell>
  );
}
