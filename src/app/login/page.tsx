import { Suspense } from "react";

import { LoadingState } from "@/components/layout/loading-state";

import { LoginForm } from "@/app/login/login-form";

export default function LoginRoutePage() {
  return (
    <main className="vendor-app-bg relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute top-[10%] left-[15%] h-64 w-64 rounded-full bg-primary/[0.08] blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[15%] right-[10%] h-48 w-48 rounded-full bg-chart-5/[0.08] blur-[80px]" />
      <div className="pointer-events-none absolute top-[40%] right-[25%] h-32 w-32 rounded-full bg-chart-2/[0.06] blur-[60px]" />

      <Suspense
        fallback={
          <LoadingState
            label="Opening sign-in…"
            rows={2}
            className="max-w-md"
          />
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
