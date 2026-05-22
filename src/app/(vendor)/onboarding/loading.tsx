import { LoadingState } from "@/components/layout/loading-state";

export default function OnboardingLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-6">
      <LoadingState label="Preparing onboarding…" rows={4} />
    </div>
  );
}
