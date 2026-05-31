import { LoadingState } from "@/components/layout/loading-state";

export default function LoginLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <LoadingState
        label="Opening sign-in…"
        rows={2}
        className="w-full max-w-sm"
        showSpinner
      />
    </div>
  );
}
