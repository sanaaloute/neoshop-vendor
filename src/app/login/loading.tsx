import { LoadingState } from "@/components/layout/loading-state";

export default function LoginLoading() {
  return (
    <div className="min-h-dvh max-w-full items-center justify-center p-4">
      <LoadingState label="Opening sign-in…" rows={2} className="max-w-sm" />
    </div>
  );
}
