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
import { getOrCreateDeviceId } from "@/lib/get-device-id";
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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const t = useTranslations("auth");
  const te = useTranslations("errors");

  const [mode, setMode] = useState<"login" | "signup">(() =>
    searchParams.get("signup") === "1" ? "signup" : "login"
  );
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const resumeStarted = useRef(false);

  // Phone login state
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<"input" | "otp">("input");
  const [isPhoneSubmitting, setIsPhoneSubmitting] = useState(false);

  const loginRateLimit = useRateLimit("auth:login", 10, 60_000);
  const registerRateLimit = useRateLimit("auth:register", 5, 60_000);
  const resendRateLimit = useRateLimit("auth:resend-verification", 3, 60_000);
  const phoneInitiateRateLimit = useRateLimit("auth:login-phone-initiate", 5, 60_000);
  const phoneVerifyRateLimit = useRateLimit("auth:login-phone-verify", 5, 60_000);

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

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(),
        password: z.string().min(1, t("password")),
      }),
    [t]
  );

  const signupSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(1, t("firstName")),
          surname: z.string().min(1, t("lastName")),
          email: z.string().email(),
          phone: z.string().refine(
            (val) => val === "" || /^\+[1-9]\d{1,14}$/.test(val),
            {
              message: t("phone"),
            }
          ),
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
    setPhoneStep("input");
    setPhone("");
    setOtp("");
  }, [mode]);

  useEffect(() => {
    setError(null);
  }, [authMethod]);

  const isSignup = mode === "signup";

  function mapAuthError(e: unknown, mode: "login" | "signup" | "forgot"): string {
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
        return m || (mode === "signup" ? te("unableToCreateAccount") : te("unableToSignIn"));
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

  async function handlePhoneSubmit() {
    setError(null);

    if (phoneStep === "input") {
      if (!phone || !/^\+[1-9]\d{1,14}$/.test(phone)) {
        setError(t("phone"));
        return;
      }
      if (!phoneInitiateRateLimit.tryRecord()) {
        setError(te("tooManyRequests"));
        return;
      }
      setIsPhoneSubmitting(true);
      try {
        const res = await useAuthStore.getState().loginPhoneInitiate(phone);
        if (res.success) {
          setPhoneStep("otp");
        } else {
          setError(res.message || te("unableToSignIn"));
        }
      } catch (e) {
        setError(mapAuthError(e, "login"));
      } finally {
        setIsPhoneSubmitting(false);
      }
    } else {
      if (!otp || otp.length < 4) {
        setError(te("invalidEmailOrPassword"));
        return;
      }
      if (!phoneVerifyRateLimit.tryRecord()) {
        setError(te("tooManyRequests"));
        return;
      }
      setIsPhoneSubmitting(true);
      try {
        await useAuthStore.getState().loginPhoneVerify({
          phone,
          code: otp,
          deviceId: getOrCreateDeviceId(),
        });
        router.replace(safePostLoginPath(searchParams.get("next")));
      } catch (e) {
        setError(mapAuthError(e, "login"));
      } finally {
        setIsPhoneSubmitting(false);
      }
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
          <p className="pt-2 text-sm text-slate-500">
            {t("signInToContinue")}
          </p>
        )}
      </div>

      <div className="mt-6">
        {signupSuccess ? (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
            {signupSuccess}
          </div>
        ) : isSignup ? (
          <VendorForm<z.infer<typeof signupSchema>>
            key="signup"
            schema={signupSchema}
            defaultValues={{
              name: "",
              surname: "",
              email: "",
              phone: "",
              password: "",
              confirmPassword: "",
            }}
            onSubmit={async (values) => {
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
                  setSignupSuccess(
                    res.message || t("accountCreatedCheckEmail")
                  );
                } else {
                  setError(t("registrationIncomplete"));
                }
              } catch (e) {
                setError(mapAuthError(e, "signup"));
              }
            }}
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
                  disabled={form.formState.isSubmitting || !registerRateLimit.canRequest}
                  className="h-12 w-full rounded-xl bg-teal-400 text-sm font-semibold text-slate-900 transition-colors hover:bg-teal-300 disabled:opacity-50"
                >
                  {form.formState.isSubmitting
                    ? t("creatingAccount")
                    : !registerRateLimit.canRequest
                      ? t("retryIn", { seconds: registerRateLimit.remainingSeconds })
                      : t("createVendorAccount")}
                </button>
              </>
            )}
          </VendorForm>
        ) : (
          <div className="space-y-4">
            {/* Auth method tabs */}
            <div className="flex gap-2 rounded-xl bg-white/[0.03] p-1">
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
            </div>

            {authMethod === "email" ? (
              <VendorForm<z.infer<typeof loginSchema>>
                key="login"
                schema={loginSchema}
                defaultValues={{ email: "", password: "" }}
                onSubmit={async (values) => {
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
                    {error ? (
                      <p className="text-sm text-red-400">{error}</p>
                    ) : null}
                    {unverifiedEmail && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm">
                        <p className="text-amber-300">
                          {t("emailNotVerified")}
                        </p>
                        {resendSuccess ? (
                          <p className="mt-1 text-green-300">{resendSuccess}</p>
                        ) : (
                          <button
                            type="button"
                            className="mt-1 text-xs font-medium text-teal-400 hover:text-teal-300 disabled:opacity-50"
                            disabled={!resendRateLimit.canRequest}
                            onClick={() => handleResendVerification(unverifiedEmail)}
                          >
                            {!resendRateLimit.canRequest
                              ? t("resendAvailableIn", { seconds: resendRateLimit.remainingSeconds })
                              : t("resendVerification")}
                          </button>
                        )}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={form.formState.isSubmitting || !loginRateLimit.canRequest}
                      className="h-12 w-full rounded-xl bg-teal-400 text-sm font-semibold text-slate-900 transition-colors hover:bg-teal-300 disabled:opacity-50"
                    >
                      {form.formState.isSubmitting
                        ? t("signingIn")
                        : !loginRateLimit.canRequest
                          ? t("retryIn", { seconds: loginRateLimit.remainingSeconds })
                          : t("continue")}
                    </button>
                  </>
                )}
              </VendorForm>
            ) : (
              <div className="space-y-4">
                {phoneStep === "input" ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      {t("phone")}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t("phonePlaceholder")}
                      autoComplete="tel"
                      className={inputClassName}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">
                      {t("enterOtp")}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      autoComplete="one-time-code"
                      className={inputClassName}
                    />
                    <p className="text-xs text-slate-500">
                      {t("otpSent")}
                    </p>
                  </div>
                )}
                {error ? (
                  <p className="text-sm text-red-400">{error}</p>
                ) : null}
                <button
                  type="button"
                  onClick={handlePhoneSubmit}
                  disabled={
                    isPhoneSubmitting ||
                    (phoneStep === "input" && !phoneInitiateRateLimit.canRequest) ||
                    (phoneStep === "otp" && !phoneVerifyRateLimit.canRequest)
                  }
                  className="h-12 w-full rounded-xl bg-teal-400 text-sm font-semibold text-slate-900 transition-colors hover:bg-teal-300 disabled:opacity-50"
                >
                  {isPhoneSubmitting
                    ? t("signingIn")
                    : phoneStep === "input"
                      ? !phoneInitiateRateLimit.canRequest
                        ? t("retryIn", { seconds: phoneInitiateRateLimit.remainingSeconds })
                        : t("continue")
                      : !phoneVerifyRateLimit.canRequest
                        ? t("retryIn", { seconds: phoneVerifyRateLimit.remainingSeconds })
                        : t("verify")}
                </button>
                {phoneStep === "otp" && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneStep("input");
                      setOtp("");
                      setError(null);
                    }}
                    className="w-full text-center text-sm text-slate-400 hover:text-slate-200"
                  >
                    {t("backToPhone")}
                  </button>
                )}
              </div>
            )}
          </div>
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
