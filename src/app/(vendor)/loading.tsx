import { LoadingState } from "@/components/layout/loading-state";

export default function VendorLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
      <LoadingState label="Loading vendor dashboard…" rows={6} />
    </div>
  );
}
