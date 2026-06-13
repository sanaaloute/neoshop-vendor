"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FileText,
  Loader2,
  ShieldCheck,
  Trash2,
  Upload,
  Building2,
  User,
  Bell,
  FileStack,
  Globe,
} from "lucide-react";
import { useTranslations } from "next-intl";

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/cards/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { vendorIsApprovedForOperations } from "@/lib/vendor-lifecycle";
import {
  getUserMe,
  patchUserMe,
  getUserSettings,
  patchUserSettings,
} from "@/services/vendor/users-api";
import {
  getVendorMe,
  patchVendorOnboarding,
  postVendorDocument,
  deleteVendorDocument,
  submitVendorVerification,
} from "@/services/vendor/vendors-api";
import type {
  UserMeResponse,
  VendorDocumentType,
  VendorLifecycleStatus,
  VendorMeResponse,
} from "@/services/vendor/types";
import type { UserSettingsResponse } from "@/services/vendor/users-api";

export function SettingsHome() {
  const t = useTranslations("settings");
  const ts = useTranslations("status");
  const td = useTranslations("documentTypes");

  const DOCUMENT_TYPE_LABELS: Record<VendorDocumentType, string> = useMemo(
    () => ({
      BUSINESS_REGISTRATION: td("businessRegistration"),
      TAX_CERTIFICATE: td("taxCertificate"),
      BANK_PROOF: td("bankProof"),
      IDENTITY: td("identity"),
      OTHER: td("other"),
    }),
    [td]
  );

  const LANGUAGES = useMemo(
    () => [
      { code: "en", label: "English" },
      { code: "fr", label: "Français" },
      { code: "es", label: "Español" },
      { code: "de", label: "Deutsch" },
      { code: "ar", label: "العربية" },
      { code: "pt", label: "Português" },
      { code: "zh", label: "中文" },
      { code: "sw", label: "Kiswahili" },
      { code: "yo", label: "Yorùbá" },
      { code: "ha", label: "Hausa" },
    ],
    []
  );

  const STATUS_VARIANTS: Record<
    VendorLifecycleStatus,
    { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
  > = useMemo(
    () => ({
      PENDING_ONBOARDING: { label: ts("pendingOnboarding"), variant: "secondary" },
      PENDING_VERIFICATION: { label: ts("pendingVerification"), variant: "outline" },
      UNDER_REVIEW: { label: ts("underReview"), variant: "default" },
      APPROVED: { label: ts("approved"), variant: "default" },
      REJECTED: { label: ts("rejected"), variant: "destructive" },
      SUSPENDED: { label: ts("suspended"), variant: "destructive" },
    }),
    [ts]
  );

  // ── Loading ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── User profile ──
  const [profile, setProfile] = useState<UserMeResponse | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // ── User settings ──
  const [settings, setSettings] = useState<UserSettingsResponse | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // ── Vendor profile ──
  const [vendor, setVendor] = useState<VendorMeResponse | null>(null);
  const [vendorSaving, setVendorSaving] = useState(false);
  const [vendorError, setVendorError] = useState<string | null>(null);
  const [vendorSuccess, setVendorSuccess] = useState(false);

  // ── Documents ──
  const [docType, setDocType] = useState<VendorDocumentType>("OTHER");
  const [docUrl, setDocUrl] = useState("");
  const [docName, setDocName] = useState("");
  const [docSaving, setDocSaving] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  // ── Verification ──
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);

      // Load user profile via /users/me (full profile including name/surname)
      try {
        const p = await getUserMe();
        if (!cancelled) setProfile(p);
      } catch (e) {
        if (!cancelled) setProfileError(httpErrorMessageForUser(e, t("couldNotLoadProfile")));
      }

      // Load user settings independently
      try {
        const s = await getUserSettings();
        if (!cancelled) setSettings(s ?? {});
      } catch (e) {
        if (!cancelled) setSettingsError(httpErrorMessageForUser(e, t("couldNotLoadPreferences")));
      }

      // Load vendor profile independently (may 403 if not registered yet)
      try {
        const v = await getVendorMe();
        if (!cancelled) setVendor(v);
      } catch (e) {
        if (!cancelled) {
          const msg = httpErrorMessageForUser(e, t("couldNotLoadBusinessProfile"));
          // Don't block the page — vendor profile is optional until onboarding
          if ((e as { response?: { status?: number } })?.response?.status === 403) {
            setVendorError(t("businessProfileNotAvailable"));
          } else {
            setVendorError(msg);
          }
        }
      }

      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  // ── Save handlers ──

  const saveProfile = async () => {
    if (!profile) return;
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);
    try {
      const updated = await patchUserMe({
        name: profile.name ?? undefined,
        surname: profile.surname ?? undefined,
        avatarUrl: profile.avatarUrl ?? undefined,
        dateOfBirth: profile.dateOfBirth?.split("T")[0] ?? undefined,
        nationality: profile.nationality ?? undefined,
        idCardType: profile.idCardType ?? undefined,
        idCardNumber: profile.idCardNumber ?? undefined,
      });
      setProfile(updated);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2000);
    } catch (e) {
      setProfileError(httpErrorMessageForUser(e, t("couldNotUpdateProfile")));
    } finally {
      setProfileSaving(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSettingsSaving(true);
    setSettingsError(null);
    setSettingsSuccess(false);
    try {
      const updated = await patchUserSettings({
        orderUpdates: settings.orderUpdates,
        promoMessages: settings.promoMessages,
        emailNewsletter: settings.emailNewsletter,
        pushEnabled: settings.pushEnabled,
        preferredLanguage: settings.preferredLanguage ?? undefined,
      });
      setSettings(updated ?? {});
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 2000);
    } catch (e) {
      setSettingsError(
        httpErrorMessageForUser(e, t("couldNotUpdatePreferences"))
      );
    } finally {
      setSettingsSaving(false);
    }
  };

  const saveVendor = async () => {
    if (!vendor) return;
    setVendorSaving(true);
    setVendorError(null);
    setVendorSuccess(false);
    try {
      const updated = await patchVendorOnboarding({
        legalBusinessName: vendor.legalBusinessName ?? undefined,
        tradeName: vendor.tradeName ?? undefined,
        taxId: vendor.taxId ?? undefined,
        businessEmail: vendor.businessEmail ?? undefined,
        businessPhone: vendor.businessPhone ?? undefined,
        countryCode: vendor.countryCode ?? undefined,
        region: vendor.region ?? undefined,
        city: vendor.city ?? undefined,
        addressLine1: vendor.addressLine1 ?? undefined,
        postalCode: vendor.postalCode ?? undefined,
      });
      setVendor(updated as VendorMeResponse);
      setVendorSuccess(true);
      setTimeout(() => setVendorSuccess(false), 2000);
    } catch (e) {
      setVendorError(
        httpErrorMessageForUser(e, t("couldNotUpdateBusinessProfile"))
      );
    } finally {
      setVendorSaving(false);
    }
  };

  const addDocument = async () => {
    if (!docUrl.trim()) {
      setDocError(t("documentUrlRequired"));
      return;
    }
    setDocSaving(true);
    setDocError(null);
    try {
      await postVendorDocument({
        type: docType,
        fileUrl: docUrl.trim(),
        fileName: docName.trim() || undefined,
      });
      const refreshed = await getVendorMe();
      setVendor(refreshed);
      setDocUrl("");
      setDocName("");
      setDocType("OTHER");
    } catch (e) {
      setDocError(httpErrorMessageForUser(e, t("couldNotAddDocument")));
    } finally {
      setDocSaving(false);
    }
  };

  const removeDocument = async (id: string) => {
    try {
      await deleteVendorDocument(id);
      const refreshed = await getVendorMe();
      setVendor(refreshed);
    } catch (e) {
      setDocError(httpErrorMessageForUser(e, t("couldNotRemoveDocument")));
    }
  };

  const handleSubmitVerification = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await submitVendorVerification();
      const refreshed = await getVendorMe();
      setVendor(refreshed);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (e) {
      setSubmitError(
        httpErrorMessageForUser(e, t("couldNotSubmitVerification"))
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render helpers ──

  const updateVendorField = (field: keyof VendorMeResponse, value: string) => {
    setVendor((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {t("loadingSettings")}
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive py-10 text-sm">{error}</p>;
  }

  const statusInfo = vendor
    ? STATUS_VARIANTS[vendor.status]
    : { label: ts("unknown"), variant: "ghost" as const };

  const canSubmitVerification =
    vendor &&
    (vendor.status === "PENDING_ONBOARDING" || vendor.status === "REJECTED");

  return (
    <Tabs defaultValue="profile" className="gap-4">
      <TabsList variant="line" className="w-full flex-wrap">
        <TabsTrigger value="profile" className="gap-1.5">
          <User className="size-3.5" />
          {t("profile")}
        </TabsTrigger>
        <TabsTrigger value="business" className="gap-1.5">
          <Building2 className="size-3.5" />
          {t("business")}
        </TabsTrigger>
        <TabsTrigger value="documents" className="gap-1.5">
          <FileStack className="size-3.5" />
          {t("documents")}
        </TabsTrigger>
        <TabsTrigger value="preferences" className="gap-1.5">
          <Bell className="size-3.5" />
          {t("preferences")}
        </TabsTrigger>
      </TabsList>

      {/* ── Profile ── */}
      <TabsContent value="profile" className="grid gap-4">
        <DashboardCard className="gap-0 py-0">
          <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
            <DashboardCardTitle className="text-base">
              {t("personalProfile")}
            </DashboardCardTitle>
            <DashboardCardDescription>
              {t("updatePublicProfile")}
            </DashboardCardDescription>
          </DashboardCardHeader>
          <DashboardCardContent className="space-y-4 px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("firstName")}</Label>
                <Input
                  id="name"
                  value={profile?.name ?? ""}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">{t("lastName")}</Label>
                <Input
                  id="surname"
                  value={profile?.surname ?? ""}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, surname: e.target.value } : prev
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">{t("dateOfBirth")}</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profile?.dateOfBirth?.split("T")[0] ?? ""}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, dateOfBirth: e.target.value } : prev
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">{t("nationality")}</Label>
                <Input
                  id="nationality"
                  value={profile?.nationality ?? ""}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, nationality: e.target.value } : prev
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idCardType">{t("idCardType")}</Label>
                <Input
                  id="idCardType"
                  value={profile?.idCardType ?? ""}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, idCardType: e.target.value } : prev
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idCardNumber">{t("idCardNumber")}</Label>
                <Input
                  id="idCardNumber"
                  value={profile?.idCardNumber ?? ""}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev ? { ...prev, idCardNumber: e.target.value } : prev
                    )
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">{t("avatarUrl")}</Label>
              <Input
                id="avatarUrl"
                value={profile?.avatarUrl ?? ""}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, avatarUrl: e.target.value } : prev
                  )
                }
                placeholder={t("avatarPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" value={profile?.email ?? ""} disabled />
            </div>
            {profileError ? (
              <p className="text-destructive text-sm">{profileError}</p>
            ) : null}
            {profileSuccess ? (
              <p className="text-green-600 text-sm">{t("profileSaved")}</p>
            ) : null}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={saveProfile}
                disabled={profileSaving}
              >
                {profileSaving ? (
                  <>
                    <Loader2 className="mr-1 size-3.5 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  t("saveProfile")
                )}
              </Button>
            </div>
          </DashboardCardContent>
        </DashboardCard>
      </TabsContent>

      {/* ── Business ── */}
      <TabsContent value="business" className="grid gap-4">
        {vendor ? (
          <>
            <DashboardCard className="gap-0 py-0">
              <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <DashboardCardTitle className="text-base">
                      {t("businessProfile")}
                    </DashboardCardTitle>
                    <DashboardCardDescription>
                      {t("legalAndContact")}
                    </DashboardCardDescription>
                  </div>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
              </DashboardCardHeader>
              <DashboardCardContent className="space-y-4 px-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="legalBusinessName">
                      {t("legalBusinessName")}
                    </Label>
                    <Input
                      id="legalBusinessName"
                      value={vendor.legalBusinessName ?? ""}
                      onChange={(e) =>
                        updateVendorField("legalBusinessName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tradeName">{t("tradeName")}</Label>
                    <Input
                      id="tradeName"
                      value={vendor.tradeName ?? ""}
                      onChange={(e) =>
                        updateVendorField("tradeName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">{t("taxId")}</Label>
                    <Input
                      id="taxId"
                      value={vendor.taxId ?? ""}
                      onChange={(e) =>
                        updateVendorField("taxId", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">{t("businessEmail")}</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      value={vendor.businessEmail ?? ""}
                      onChange={(e) =>
                        updateVendorField("businessEmail", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">{t("businessPhone")}</Label>
                    <Input
                      id="businessPhone"
                      value={vendor.businessPhone ?? ""}
                      onChange={(e) =>
                        updateVendorField("businessPhone", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="countryCode">{t("countryCode")}</Label>
                    <Input
                      id="countryCode"
                      value={vendor.countryCode ?? ""}
                      onChange={(e) =>
                        updateVendorField("countryCode", e.target.value)
                      }
                      placeholder={t("countryPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">{t("region")}</Label>
                    <Input
                      id="region"
                      value={vendor.region ?? ""}
                      onChange={(e) =>
                        updateVendorField("region", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">{t("city")}</Label>
                    <Input
                      id="city"
                      value={vendor.city ?? ""}
                      onChange={(e) =>
                        updateVendorField("city", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="addressLine1">{t("addressLine1")}</Label>
                    <Input
                      id="addressLine1"
                      value={vendor.addressLine1 ?? ""}
                      onChange={(e) =>
                        updateVendorField("addressLine1", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">{t("postalCode")}</Label>
                    <Input
                      id="postalCode"
                      value={vendor.postalCode ?? ""}
                      onChange={(e) =>
                        updateVendorField("postalCode", e.target.value)
                      }
                    />
                  </div>
                </div>
                {vendorError ? (
                  <p className="text-destructive text-sm">{vendorError}</p>
                ) : null}
                {vendorSuccess ? (
                  <p className="text-green-600 text-sm">
                    {t("businessProfileSaved")}
                  </p>
                ) : null}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={saveVendor}
                    disabled={vendorSaving}
                  >
                    {vendorSaving ? (
                      <>
                        <Loader2 className="mr-1 size-3.5 animate-spin" />
                        {t("saving")}
                      </>
                    ) : (
                      t("saveBusinessProfile")
                    )}
                  </Button>
                </div>
              </DashboardCardContent>
            </DashboardCard>

            {/* Verification status card */}
            <DashboardCard className="gap-0 py-0">
              <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <DashboardCardTitle className="text-base">
                      {t("verification")}
                    </DashboardCardTitle>
                    <DashboardCardDescription>
                      {t("trackStatus")}
                    </DashboardCardDescription>
                  </div>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
              </DashboardCardHeader>
              <DashboardCardContent className="space-y-4 px-4 py-4">
                {vendor.statusHistory.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("statusHistory")}
                    </p>
                    <ul className="space-y-2">
                      {vendor.statusHistory.map((entry, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
                        >
                          <span className="font-medium">{STATUS_VARIANTS[entry.status]?.label ?? entry.status}</span>
                          <span className="text-muted-foreground text-xs">
                            {new Date(entry.createdAt).toLocaleDateString()}
                            {entry.note ? ` — ${entry.note}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t("noStatusHistory")}
                  </p>
                )}

                {canSubmitVerification ? (
                  <div className="flex flex-col items-start gap-2">
                    <Button
                      type="button"
                      onClick={handleSubmitVerification}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-1 size-3.5 animate-spin" />
                          {t("submitting")}
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="mr-1 size-4" />
                          {t("submitForVerification")}
                        </>
                      )}
                    </Button>
                    {submitError ? (
                      <p className="text-destructive text-sm">{submitError}</p>
                    ) : null}
                    {submitSuccess ? (
                      <p className="text-green-600 text-sm">
                        {t("submittedSuccessfully")}
                      </p>
                    ) : null}
                  </div>
                ) : vendorIsApprovedForOperations(vendor.status) ? (
                  <p className="text-green-600 text-sm">
                    {t("approvedAndActive")}
                  </p>
                ) : null}
              </DashboardCardContent>
            </DashboardCard>
          </>
        ) : (
          <div className="py-10 text-sm">
            {vendorError ? (
              <p className="text-destructive">{vendorError}</p>
            ) : (
              <p className="text-muted-foreground">
                {t("noVendorProfile")}
              </p>
            )}
          </div>
        )}
      </TabsContent>

      {/* ── Documents ── */}
      <TabsContent value="documents" className="grid gap-4">
        {vendor ? (
          <>
            <DashboardCard className="gap-0 py-0">
              <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
                <DashboardCardTitle className="text-base">
                  {t("documentsTitle")}
                </DashboardCardTitle>
                <DashboardCardDescription>
                  {t("uploadDocuments")}
                </DashboardCardDescription>
              </DashboardCardHeader>
              <DashboardCardContent className="space-y-4 px-4 py-4">
                {/* Add document form */}
                <div className="grid gap-3 rounded-lg border border-border/60 p-3">
                  <p className="text-xs font-medium">{t("addNewDocument")}</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("type")}</Label>
                      <select
                        className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                        value={docType}
                        onChange={(e) =>
                          setDocType(e.target.value as VendorDocumentType)
                        }
                      >
                        {Object.entries(DOCUMENT_TYPE_LABELS).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">{t("fileUrl")}</Label>
                      <Input
                        className="h-9"
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        placeholder={t("fileUrlPlaceholder")}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("fileNameOptional")}</Label>
                    <Input
                      className="h-9"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder={t("fileNamePlaceholder")}
                    />
                  </div>
                  {docError ? (
                    <p className="text-destructive text-sm">{docError}</p>
                  ) : null}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={addDocument}
                      disabled={docSaving}
                    >
                      {docSaving ? (
                        <>
                          <Loader2 className="mr-1 size-3.5 animate-spin" />
                          {t("adding")}
                        </>
                      ) : (
                        <>
                          <Upload className="mr-1 size-3.5" />
                          {t("addDocument")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Document list */}
                {vendor.documents.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("uploadedDocuments")}
                    </p>
                    <ul className="space-y-2">
                      {vendor.documents.map((doc) => (
                        <li
                          key={doc.id}
                          className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="text-muted-foreground size-4 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {doc.fileName ||
                                  doc.fileUrl.split("/").pop() ||
                                  t("documentFallback")}
                              </p>
                              <p className="text-muted-foreground text-[10px]">
                                {DOCUMENT_TYPE_LABELS[doc.type]} ·{" "}
                                {new Date(
                                  doc.createdAt
                                ).toLocaleDateString()}
                                {doc.verifiedAt
                                  ? ` · ${t("verified")} ${new Date(
                                      doc.verifiedAt
                                    ).toLocaleDateString()}`
                                  : ` · ${t("pendingVerification")}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive"
                              onClick={() => removeDocument(doc.id)}
                              title={t("removeDocument")}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t("noDocuments")}
                  </p>
                )}
              </DashboardCardContent>
            </DashboardCard>
          </>
        ) : (
          <div className="py-10 text-sm">
            {vendorError ? (
              <p className="text-destructive">{vendorError}</p>
            ) : (
              <p className="text-muted-foreground">
                {t("noVendorProfile")}
              </p>
            )}
          </div>
        )}
      </TabsContent>

      {/* ── Preferences ── */}
      <TabsContent value="preferences" className="grid gap-4">
        <DashboardCard className="gap-0 py-0">
          <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
            <DashboardCardTitle className="text-base">
              {t("preferencesTitle")}
            </DashboardCardTitle>
            <DashboardCardDescription>
              {t("controlNotifications")}
            </DashboardCardDescription>
          </DashboardCardHeader>
          <DashboardCardContent className="space-y-4 px-4 py-4">
            {(
              [
                { key: "orderUpdates", label: t("orderUpdates") },
                { key: "promoMessages", label: t("promoMessages") },
                { key: "emailNewsletter", label: t("emailNewsletter") },
                { key: "pushEnabled", label: t("pushNotifications") },
              ] as const
            ).map(({ key, label }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5"
              >
                <span className="text-sm">{label}</span>
                <input
                  type="checkbox"
                  className="accent-primary size-4"
                  checked={settings?.[key] ?? false}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev ? { ...prev, [key]: e.target.checked } : prev
                    )
                  }
                />
              </label>
            ))}

            {/* Language preference */}
            <div className="space-y-2 rounded-lg border border-border/60 px-3 py-3">
              <div className="flex items-center gap-2">
                <Globe className="text-muted-foreground size-4" />
                <span className="text-sm font-medium">
                  {t("preferredLanguage")}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {t("preferredLanguageHint")}
              </p>
              <select
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                value={settings?.preferredLanguage ?? "en"}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev
                      ? { ...prev, preferredLanguage: e.target.value }
                      : prev
                  )
                }
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {settingsError ? (
              <p className="text-destructive text-sm">{settingsError}</p>
            ) : null}
            {settingsSuccess ? (
              <p className="text-green-600 text-sm">{t("preferencesSaved")}</p>
            ) : null}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={saveSettings}
                disabled={settingsSaving}
              >
                {settingsSaving ? (
                  <>
                    <Loader2 className="mr-1 size-3.5 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  t("savePreferences")
                )}
              </Button>
            </div>
          </DashboardCardContent>
        </DashboardCard>
      </TabsContent>
    </Tabs>
  );
}
