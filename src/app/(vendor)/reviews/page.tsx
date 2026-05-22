import { FeaturePageShell } from "@/components/layout/feature-page-shell";
import { ReviewsHome } from "@/modules/reviews";

export default function ReviewsRoutePage() {
  return (
    <FeaturePageShell title="Reviews" className="max-w-6xl">
      <ReviewsHome />
    </FeaturePageShell>
  );
}
