import { Suspense } from "react";

import { LoadingState } from "@/components/layout/loading-state";

import { LoginForm } from "@/app/login/login-form";

export default function LoginRoutePage() {
  return (
    <main className="vendor-app-bg relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute top-[5%] left-[10%] h-72 w-72 rounded-full bg-primary/[0.1] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[10%] right-[5%] h-56 w-56 rounded-full bg-chart-5/[0.1] blur-[100px]" />
      <div className="pointer-events-none absolute top-[35%] right-[30%] h-40 w-40 rounded-full bg-chart-2/[0.08] blur-[80px]" />
      <div className="pointer-events-none absolute bottom-[30%] left-[20%] h-32 w-32 rounded-full bg-chart-3/[0.08] blur-[60px]" />

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
