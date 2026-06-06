"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { z } from "zod";
import { useTranslations } from "next-intl";

import { VendorForm } from "@/components/forms/vendor-form";
import { VendorPasswordField } from "@/components/forms/vendor-password-field";
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
import { postAuthResetPassword } from "@/services/vendor/auth-gateway-api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const [token, setToken] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rateLimit = useRateLimit("auth:reset-password", 5, 60_000);

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) setToken(t);
  }, [searchParams]);

  const passwordSchema = z
    .string()
    .min(8, t("passwordHint"))
    .regex(/[A-Z]/, t("passwordHint"))
    .regex(/[a-z]/, t("passwordHint"))
    .regex(/[0-9]/, t("passwordHint"));

  const schema = z
    .object({
      password: passwordSchema,
      confirmPassword: z.string().min(1, t("confirmPassword")),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t("confirmPassword"),
      path: ["confirmPassword"],
    });

  type Values = z.infer<typeof schema>;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Create new password</CardTitle>
          <CardDescription>
            Enter a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!token ? (
            <div className="space-y-4">
              <VendorMuted className="text-destructive text-center">
                Invalid or missing reset token. Please request a new password reset link.
              </VendorMuted>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push("/login/forgot-password")}
              >
                Request new link
              </Button>
            </div>
          ) : success ? (
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
              defaultValues={{ password: "", confirmPassword: "" }}
              onSubmit={async (values) => {
                setError(null);
                setSuccess(null);
                if (!rateLimit.tryRecord()) {
                  setError(te("tooManyRequests"));
                  return;
                }
                try {
                  await postAuthResetPassword({
                    token: token!,
                    newPassword: values.password,
                  });
                  setSuccess(
                    "Your password has been reset. Please sign in with your new password."
                  );
                } catch (e) {
                  const msg = getAuthErrorMessage(e) || "Could not reset password. Try again.";
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
                  <VendorPasswordField
                    control={form.control}
                    name="password"
                    label={t("password")}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <p className="text-muted-foreground text-xs">
                    {t("passwordHint")}
                  </p>
                  <VendorPasswordField
                    control={form.control}
                    name="confirmPassword"
                    label={t("confirmPassword")}
                    placeholder="••••••••"
                    autoComplete="new-password"
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
                        : "Reset password"}
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
