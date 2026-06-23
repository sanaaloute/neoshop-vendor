"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { z } from "zod";
import { useTranslations } from "next-intl";

import { VendorForm } from "@/components/forms/vendor-form";
import { VendorTextField } from "@/components/forms/vendor-text-field";
import { VendorPasswordField } from "@/components/forms/vendor-password-field";
import { useAuth } from "@/hooks/use-auth";
import { getAuthErrorMessage } from "@/lib/get-auth-error-message";
import { useRateLimit } from "@/lib/rate-limit";
import { refreshTokensClient } from "@/services/auth-refresh-client";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

/** Reject absolute and protocol-relative URLs from `?next=` (open-redirect hardening). */
function safePostLoginPath(next: string | null): string {
  if (!next) return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

function isEmailNotVerifiedError(e: unknown): boolean {
  return getAuthErrorMessage(e).includes("Email not verified");
}

const phoneRegex = /^\+[1-9]\d{1,14}$/;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const t = useTranslations("auth");
  const te = useTranslations("errors");

  const [mode, setMode] = useState<"login" | "signup">(() =>
    searchParams.get("signup") === "1" ? "signup" : "login"
  );
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const resumeStarted = useRef(false);

  const loginRateLimit = useRateLimit("auth:login", 10, 60_000);
  const phoneLoginRateLimit = useRateLimit("auth:login-phone", 10, 60_000);
  const registerRateLimit = useRateLimit("auth:register", 5, 60_000);
  const phoneRegisterRateLimit = useRateLimit("auth:register-phone", 5, 60_000);
  const resendRateLimit = useRateLimit("auth:resend-verification", 3, 60_000);

  const passwordSchema = useMemo(
    () =>
      z
        .string()
        .min(8, t("passwordHint"))
        .regex(/[A-Z]/, t("passwordHint"))
        .regex(/[a-z]/, t("passwordHint"))
        .regex(/[0-9]/, t("passwordHint")),
    [t]
  );

  const emailLoginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(),
        password: z.string().min(1, t("password")),
      }),
    [t]
  );

  const phoneLoginSchema = useMemo(
    () =>
      z.object({
        phone: z.string().regex(phoneRegex, t("phone")),
        password: z.string().min(1, t("password")),
      }),
    [t]
  );

  const emailSignupSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(1, t("firstName")),
          surname: z.string().min(1, t("lastName")),
          email: z.string().email(),
          phone: z
            .string()
            .refine((val) => val === "" || phoneRegex.test(val), {
              message: t("phone"),
            }),
          password: passwordSchema,
          confirmPassword: z.string().min(1, t("confirmPassword")),
        })
        .refine((d) => d.password === d.confirmPassword, {
          message: t("confirmPassword"),
          path: ["confirmPassword"],
        }),
    [t, passwordSchema]
  );

  const phoneSignupSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(1, t("firstName")),
          surname: z.string().min(1, t("lastName")),
          phone: z.string().regex(phoneRegex, t("phone")),
          password: passwordSchema,
          confirmPassword: z.string().min(1, t("confirmPassword")),
        })
        .refine((d) => d.password === d.confirmPassword, {
          message: t("confirmPassword"),
          path: ["confirmPassword"],
        }),
    [t, passwordSchema]
  );

  useEffect(() => {
    if (searchParams.get("resume") !== "1" || resumeStarted.current) return;
    resumeStarted.current = true;

    void refreshTokensClient().then(async (token) => {
      if (!token) return;
      await useAuthStore.getState().bootstrap();
      router.replace(safePostLoginPath(searchParams.get("next")));
    });
  }, [router, searchParams]);

  useEffect(() => {
    setError(null);
    setSignupSuccess(null);
    setUnverifiedEmail(null);
    setResendSuccess(null);
  }, [mode, authMethod]);

  const isSignup = mode === "signup";

  function mapAuthError(
    e: unknown,
    mode: "login" | "signup" | "forgot"
  ): string {
    const m = getAuthErrorMessage(e);

    if (mode === "forgot") {
      return m || te("couldNotSendReset");
    }

    switch (m) {
      case "not_vendor":
        return mode === "signup" ? te("notVendorSignup") : te("notVendorLogin");
      case "signup_confirm_email":
        return te("checkEmailConfirm");
      case "sign_in_no_session":
        return te("signInNoSession");
      case "signup_no_tokens":
        return te("signupNoTokens");
      default: {
        if (
          m.includes("Invalid login credentials") ||
          m.includes("invalid_credentials") ||
          m.includes("Invalid credentials")
        ) {
          return te("invalidEmailOrPassword");
        }
        if (m.includes("Email not verified")) {
          return te("emailNotVerified");
        }
        if (m.includes("Account is suspended")) {
          return te("accountSuspended");
        }
        if (m.includes("Account already exists")) {
          return te("accountAlreadyExists");
        }
        if (m.includes("Email address is already in use or invalid")) {
          return te("emailInUseOrInvalid");
        }
        if (
          m.includes("Session not found or revoked") ||
          m.includes("Missing session header") ||
          m.includes("Invalid or expired session")
        ) {
          return te("sessionNotFound");
        }
        if (m.includes("Too many failed attempts")) {
          return m;
        }
        if (m.includes("Too many requests")) {
          return te("tooManyRequests");
        }
        return (
          m ||
          (mode === "signup"
            ? te("unableToCreateAccount")
            : te("unableToSignIn"))
        );
      }
    }
  }

  async function handleResendVerification(email: string) {
    setError(null);
    setResendSuccess(null);
    if (!resendRateLimit.tryRecord()) {
      setError(te("tooManyRequests"));
      return;
    }
    try {
      await useAuthStore.getState().resendVerification({ email });
      setResendSuccess(t("resendSuccess"));
    } catch (e) {
      setError(mapAuthError(e, "forgot"));
    }
  }

  async function handleEmailLogin(values: z.infer<typeof emailLoginSchema>) {
    setError(null);
    setUnverifiedEmail(null);
    setResendSuccess(null);
    if (!loginRateLimit.tryRecord()) {
      setError(te("tooManyRequests"));
      return;
    }
    try {
      await login(values);
      router.replace(safePostLoginPath(searchParams.get("next")));
    } catch (e) {
      if (isEmailNotVerifiedError(e)) {
        setUnverifiedEmail(values.email);
      }
      setError(mapAuthError(e, "login"));
    }
  }

  async function handlePhoneLogin(values: z.infer<typeof phoneLoginSchema>) {
    setError(null);
    if (!phoneLoginRateLimit.tryRecord()) {
      setError(te("tooManyRequests"));
      return;
    }
    try {
      await useAuthStore.getState().loginPhone(values);
      router.replace(safePostLoginPath(searchParams.get("next")));
    } catch (e) {
      setError(mapAuthError(e, "login"));
    }
  }

  async function handleEmailSignup(values: z.infer<typeof emailSignupSchema>) {
    setError(null);
    setSignupSuccess(null);
    if (!registerRateLimit.tryRecord()) {
      setError(te("tooManyRequests"));
      return;
    }
    try {
      const res = await useAuthStore.getState().register({
        email: values.email,
        password: values.password,
        name: values.name,
        surname: values.surname,
        phone: values.phone || undefined,
      });
      if (res.success) {
        setSignupSuccess(res.message || t("accountCreatedCheckEmail"));
      } else {
        setError(t("registrationIncomplete"));
      }
    } catch (e) {
      setError(mapAuthError(e, "signup"));
    }
  }

  async function handlePhoneSignup(values: z.infer<typeof phoneSignupSchema>) {
    setError(null);
    setSignupSuccess(null);
    if (!phoneRegisterRateLimit.tryRecord()) {
      setError(te("tooManyRequests"));
      return;
    }
    try {
      await useAuthStore.getState().registerPhone({
        phone: values.phone,
        password: values.password,
        name: values.name,
        surname: values.surname,
      });
      router.replace(safePostLoginPath(searchParams.get("next")));
    } catch (e) {
      setError(mapAuthError(e, "signup"));
    }
  }

  const inputClassName =
    "h-12 rounded-xl border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-slate-500 focus-visible:border-teal-400/50 focus-visible:ring-teal-400/20 dark:bg-white/[0.04]";

  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-white/[0.06] bg-[#0f0f16]/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {isSignup ? t("createAccount") : t("signIn")}
        </h1>
        <p className="text-sm leading-relaxed text-slate-400">
          {isSignup ? t("registerDescription") : t("signInDescription")}
        </p>
        {!isSignup && (
          <p className="pt-2 text-sm text-slate-500">{t("signInToContinue")}</p>
        )}
      </div>

      <div className="mt-6">
        {/* Auth method tabs */}
        <div className="mb-6 flex gap-2 rounded-xl bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => setAuthMethod("phone")}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
              authMethod === "phone"
                ? "bg-teal-400 text-slate-900"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            {t("phone")}
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod("email")}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
              authMethod === "email"
                ? "bg-teal-400 text-slate-900"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            {t("email")}
          </button>
        </div>

        {signupSuccess ? (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
            {signupSuccess}
          </div>
        ) : isSignup ? (
          authMethod === "phone" ? (
            <VendorForm<z.infer<typeof phoneSignupSchema>>
              key="signup-phone"
              schema={phoneSignupSchema}
              defaultValues={{
                name: "",
                surname: "",
                phone: "",
                password: "",
                confirmPassword: "",
              }}
              onSubmit={handlePhoneSignup}
              className="w-full space-y-4"
            >
              {(form) => (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <VendorTextField
                      control={form.control}
                      name="name"
                      label={t("firstName")}
                      placeholder={t("firstNamePlaceholder")}
                      autoComplete="given-name"
                      inputClassName={inputClassName}
                      labelClassName="text-slate-400"
                    />
                    <VendorTextField
                      control={form.control}
                      name="surname"
                      label={t("lastName")}
                      placeholder={t("lastNamePlaceholder")}
                      autoComplete="family-name"
                      inputClassName={inputClassName}
                      labelClassName="text-slate-400"
                    />
                  </div>
                  <VendorTextField
                    control={form.control}
                    name="phone"
                    label={t("phone")}
                    placeholder={t("phonePlaceholder")}
                    type="tel"
                    autoComplete="tel"
                    inputClassName={inputClassName}
                    labelClassName="text-slate-400"
                  />
                  <div className="space-y-1">
                    <VendorPasswordField
                      control={form.control}
                      name="password"
                      label={t("password")}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      inputClassName={inputClassName}
                      labelClassName="text-slate-400"
                    />
                    <p className="text-xs text-slate-500">
                      {t("passwordHint")}
                    </p>
                  </div>
                  <VendorPasswordField
                    control={form.control}
                    name="confirmPassword"
                    label={t("confirmPassword")}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    inputClassName={inputClassName}
                    labelClassName="text-slate-400"
                  />
                  {error ? (
                    <p className="text-sm text-red-400">{error}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={
                      form.formState.isSubmitting ||
                      !phoneRegisterRateLimit.canRequest
                    }
                    className="h-12 w-full rounded-xl bg-teal-400 text-sm font-semibold text-slate-900 transition-colors hover:bg-teal-300 disabled:opacity-50"
                  >
                    {form.formState.isSubmitting
                      ? t("creatingAccount")
                      : !phoneRegisterRateLimit.canRequest
                        ? t("retryIn", {
                            seconds: phoneRegisterRateLimit.remainingSeconds,
                          })
                        : t("createVendorAccount")}
                  </button>
                </>
              )}
            </VendorForm>
          ) : (
            <VendorForm<z.infer<typeof emailSignupSchema>>
              key="signup-email"
              schema={emailSignupSchema}
              defaultValues={{
                name: "",
                surname: "",
                email: "",
                phone: "",
                password: "",
                confirmPassword: "",
              }}
              onSubmit={handleEmailSignup}
              className="w-full space-y-4"
            >
              {(form) => (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <VendorTextField
                      control={form.control}
                      name="name"
                      label={t("firstName")}
                      placeholder={t("firstNamePlaceholder")}
                      autoComplete="given-name"
                      inputClassName={inputClassName}
                      labelClassName="text-slate-400"
                    />
                    <VendorTextField
                      control={form.control}
                      name="surname"
                      label={t("lastName")}
                      placeholder={t("lastNamePlaceholder")}
                      autoComplete="family-name"
                      inputClassName={inputClassName}
                      labelClassName="text-slate-400"
                    />
                  </div>
                  <VendorTextField
                    control={form.control}
                    name="email"
                    label={t("email")}
                    placeholder={t("emailPlaceholder")}
                    type="email"
                    autoComplete="email"
                    inputClassName={inputClassName}
                    labelClassName="text-slate-400"
                  />
                  <VendorTextField
                    control={form.control}
                    name="phone"
                    label={t("phone")}
                    placeholder={t("phonePlaceholder")}
                    type="tel"
                    autoComplete="tel"
                    inputClassName={inputClassName}
                    labelClassName="text-slate-400"
                  />
                  <div className="space-y-1">
                    <VendorPasswordField
                      control={form.control}
                      name="password"
                      label={t("password")}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      inputClassName={inputClassName}
                      labelClassName="text-slate-400"
                    />
                    <p className="text-xs text-slate-500">
                      {t("passwordHint")}
                    </p>
                  </div>
                  <VendorPasswordField
                    control={form.control}
                    name="confirmPassword"
                    label={t("confirmPassword")}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    inputClassName={inputClassName}
                    labelClassName="text-slate-400"
                  />
                  {error ? (
                    <p className="text-sm text-red-400">{error}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={
                      form.formState.isSubmitting ||
                      !registerRateLimit.canRequest
                    }
                    className="h-12 w-full rounded-xl bg-teal-400 text-sm font-semibold text-slate-900 transition-colors hover:bg-teal-300 disabled:opacity-50"
                  >
                    {form.formState.isSubmitting
                      ? t("creatingAccount")
                      : !registerRateLimit.canRequest
                        ? t("retryIn", {
                            seconds: registerRateLimit.remainingSeconds,
                          })
                        : t("createVendorAccount")}
                  </button>
                </>
              )}
            </VendorForm>
          )
        ) : authMethod === "phone" ? (
          <VendorForm<z.infer<typeof phoneLoginSchema>>
            key="login-phone"
            schema={phoneLoginSchema}
            defaultValues={{ phone: "", password: "" }}
            onSubmit={handlePhoneLogin}
            className="w-full space-y-4"
          >
            {(form) => (
              <>
                <VendorTextField
                  control={form.control}
                  name="phone"
                  label={t("phone")}
                  placeholder={t("phonePlaceholder")}
                  type="tel"
                  autoComplete="tel"
                  inputClassName={inputClassName}
                  labelClassName="text-slate-400"
                />
                <VendorPasswordField
                  control={form.control}
                  name="password"
                  label={t("password")}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  inputClassName={inputClassName}
                  labelClassName="text-slate-400"
                />
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
                <button
                  type="submit"
                  disabled={
                    form.formState.isSubmitting ||
                    !phoneLoginRateLimit.canRequest
                  }
                  className="h-12 w-full rounded-xl bg-teal-400 text-sm font-semibold text-slate-900 transition-colors hover:bg-teal-300 disabled:opacity-50"
                >
                  {form.formState.isSubmitting
                    ? t("signingIn")
                    : !phoneLoginRateLimit.canRequest
                      ? t("retryIn", {
                          seconds: phoneLoginRateLimit.remainingSeconds,
                        })
                      : t("continue")}
                </button>
              </>
            )}
          </VendorForm>
        ) : (
          <VendorForm<z.infer<typeof emailLoginSchema>>
            key="login-email"
            schema={emailLoginSchema}
            defaultValues={{ email: "", password: "" }}
            onSubmit={handleEmailLogin}
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
                  inputClassName={inputClassName}
                  labelClassName="text-slate-400"
                />
                <VendorPasswordField
                  control={form.control}
                  name="password"
                  label={t("password")}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  inputClassName={inputClassName}
                  labelClassName="text-slate-400"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-teal-400 hover:text-teal-300"
                    onClick={() => router.push("/login/forgot-password")}
                  >
                    {t("forgotPassword")}
                  </button>
                </div>
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
                {unverifiedEmail && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm">
                    <p className="text-amber-300">{t("emailNotVerified")}</p>
                    {resendSuccess ? (
                      <p className="mt-1 text-green-300">{resendSuccess}</p>
                    ) : (
                      <button
                        type="button"
                        className="mt-1 text-xs font-medium text-teal-400 hover:text-teal-300 disabled:opacity-50"
                        disabled={!resendRateLimit.canRequest}
                        onClick={() =>
                          handleResendVerification(unverifiedEmail)
                        }
                      >
                        {!resendRateLimit.canRequest
                          ? t("resendAvailableIn", {
                              seconds: resendRateLimit.remainingSeconds,
                            })
                          : t("resendVerification")}
                      </button>
                    )}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={
                    form.formState.isSubmitting || !loginRateLimit.canRequest
                  }
                  className="h-12 w-full rounded-xl bg-teal-400 text-sm font-semibold text-slate-900 transition-colors hover:bg-teal-300 disabled:opacity-50"
                >
                  {form.formState.isSubmitting
                    ? t("signingIn")
                    : !loginRateLimit.canRequest
                      ? t("retryIn", {
                          seconds: loginRateLimit.remainingSeconds,
                        })
                      : t("continue")}
                </button>
              </>
            )}
          </VendorForm>
        )}

        {!signupSuccess && (
          <div className="mt-6 text-center text-sm">
            {isSignup ? (
              <p className="text-slate-500">
                {t("alreadyHaveAccount")}{" "}
                <button
                  type="button"
                  className="font-medium text-teal-400 hover:text-teal-300"
                  onClick={() => setMode("login")}
                >
                  {t("signInLink")}
                </button>
              </p>
            ) : (
              <p className="text-slate-500">
                {t("newVendor")}{" "}
                <button
                  type="button"
                  className="font-medium text-teal-400 hover:text-teal-300"
                  onClick={() => setMode("signup")}
                >
                  {t("createAccountLink")}
                </button>
              </p>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-600">
          {t("onboardingHint")}
        </p>
      </div>
    </div>
  );
}
