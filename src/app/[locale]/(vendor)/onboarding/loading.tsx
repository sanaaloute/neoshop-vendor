import { PageSkeleton } from "@/components/layout/page-skeleton";

export default function OnboardingLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-6">
      <PageSkeleton className="p-0" />
    </div>
  );
}
