"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { z } from "zod";
import { useTranslations } from "next-intl";

import { VendorForm } from "@/components/forms/vendor-form";
import { VendorTextField } from "@/components/forms/vendor-text-field";
import { VendorMuted } from "@/components/layout/typography";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthErrorMessage } from "@/lib/get-auth-error-message";
import { useRateLimit } from "@/lib/rate-limit";
import { postAuthForgotPassword } from "@/services/vendor/auth-gateway-api";

const schema = z.object({
  email: z.string().email(),
});

type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rateLimit = useRateLimit("auth:forgot-password", 3, 60_000);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-800 dark:text-green-200">
                {success}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push("/login")}
              >
                {t("signInLink")}
              </Button>
            </div>
          ) : (
            <VendorForm<Values>
              schema={schema}
              defaultValues={{ email: "" }}
              onSubmit={async (values) => {
                setError(null);
                setSuccess(null);
                if (!rateLimit.tryRecord()) {
                  setError(te("tooManyRequests"));
                  return;
                }
                try {
                  await postAuthForgotPassword({ email: values.email });
                  setSuccess(
                    "If an account exists with this email, you will receive a password reset link."
                  );
                } catch (e) {
                  const msg = getAuthErrorMessage(e) || te("couldNotSendReset");
                  if (msg.includes("Too many requests")) {
                    setError(te("tooManyRequests"));
                  } else {
                    setError(msg);
                  }
                }
              }}
              className="w-full space-y-4"
            >
              {(form) => (
                <>
                  <VendorTextField
                    control={form.control}
                    name="email"
                    label={t("email")}
                    placeholder={t("emailPlaceholder")}
                    type="email"
                    autoComplete="email"
                  />
                  {error ? (
                    <VendorMuted className="text-destructive">{error}</VendorMuted>
                  ) : null}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={form.formState.isSubmitting || !rateLimit.canRequest}
                  >
                    {form.formState.isSubmitting
                      ? t("saving")
                      : !rateLimit.canRequest
                        ? t("retryIn", { seconds: rateLimit.remainingSeconds })
                        : "Send reset link"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => router.push("/login")}
                  >
                    {t("signInLink")}
                  </Button>
                </>
              )}
            </VendorForm>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
