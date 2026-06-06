"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

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

const DOCUMENT_TYPE_LABELS: Record<VendorDocumentType, string> = {
  BUSINESS_REGISTRATION: "Business Registration",
  TAX_CERTIFICATE: "Tax Certificate",
  BANK_PROOF: "Bank Proof",
  IDENTITY: "Identity",
  OTHER: "Other",
};

const STATUS_VARIANTS: Record<
  VendorLifecycleStatus,
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  PENDING_ONBOARDING: { label: "Pending Onboarding", variant: "secondary" },
  PENDING_VERIFICATION: { label: "Pending Verification", variant: "outline" },
  UNDER_REVIEW: { label: "Under Review", variant: "default" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  SUSPENDED: { label: "Suspended", variant: "destructive" },
};

export function SettingsHome() {
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
        if (!cancelled) setProfileError(httpErrorMessageForUser(e, "Could not load profile."));
      }

      // Load user settings independently
      try {
        const s = await getUserSettings();
        if (!cancelled) setSettings(s ?? {});
      } catch (e) {
        if (!cancelled) setSettingsError(httpErrorMessageForUser(e, "Could not load preferences."));
      }

      // Load vendor profile independently (may 403 if not registered yet)
      try {
        const v = await getVendorMe();
        if (!cancelled) setVendor(v);
      } catch (e) {
        if (!cancelled) {
          const msg = httpErrorMessageForUser(e, "Could not load business profile.");
          // Don't block the page — vendor profile is optional until onboarding
          if ((e as { response?: { status?: number } })?.response?.status === 403) {
            setVendorError("Business profile not available yet. Complete onboarding to unlock this section.");
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
  }, []);

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
      });
      setProfile(updated);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2000);
    } catch (e) {
      setProfileError(httpErrorMessageForUser(e, "Could not update profile."));
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
      });
      setSettings(updated ?? {});
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 2000);
    } catch (e) {
      setSettingsError(
        httpErrorMessageForUser(e, "Could not update preferences.")
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
        httpErrorMessageForUser(e, "Could not update business profile.")
      );
    } finally {
      setVendorSaving(false);
    }
  };

  const addDocument = async () => {
    if (!docUrl.trim()) {
      setDocError("Document URL is required.");
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
      setDocError(httpErrorMessageForUser(e, "Could not add document."));
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
      setDocError(httpErrorMessageForUser(e, "Could not remove document."));
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
        httpErrorMessageForUser(e, "Could not submit verification.")
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
        Loading settings…
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive py-10 text-sm">{error}</p>;
  }

  const statusInfo = vendor
    ? STATUS_VARIANTS[vendor.status]
    : { label: "Unknown", variant: "ghost" as const };

  const canSubmitVerification =
    vendor &&
    (vendor.status === "PENDING_ONBOARDING" || vendor.status === "REJECTED");

  return (
    <Tabs defaultValue="profile" className="gap-4">
      <TabsList variant="line" className="w-full flex-wrap">
        <TabsTrigger value="profile" className="gap-1.5">
          <User className="size-3.5" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="business" className="gap-1.5">
          <Building2 className="size-3.5" />
          Business
        </TabsTrigger>
        <TabsTrigger value="documents" className="gap-1.5">
          <FileStack className="size-3.5" />
          Documents
        </TabsTrigger>
        <TabsTrigger value="preferences" className="gap-1.5">
          <Bell className="size-3.5" />
          Preferences
        </TabsTrigger>
      </TabsList>

      {/* ── Profile ── */}
      <TabsContent value="profile" className="grid gap-4">
        <DashboardCard className="gap-0 py-0">
          <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
            <DashboardCardTitle className="text-base">
              Personal Profile
            </DashboardCardTitle>
            <DashboardCardDescription>
              Update your public profile information.
            </DashboardCardDescription>
          </DashboardCardHeader>
          <DashboardCardContent className="space-y-4 px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">First name</Label>
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
                <Label htmlFor="surname">Last name</Label>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                value={profile?.avatarUrl ?? ""}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, avatarUrl: e.target.value } : prev
                  )
                }
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email ?? ""} disabled />
            </div>
            {profileError ? (
              <p className="text-destructive text-sm">{profileError}</p>
            ) : null}
            {profileSuccess ? (
              <p className="text-green-600 text-sm">Profile saved.</p>
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
                    Saving…
                  </>
                ) : (
                  "Save profile"
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
                      Business Profile
                    </DashboardCardTitle>
                    <DashboardCardDescription>
                      Legal and contact information for your vendor account.
                    </DashboardCardDescription>
                  </div>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
              </DashboardCardHeader>
              <DashboardCardContent className="space-y-4 px-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="legalBusinessName">
                      Legal Business Name
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
                    <Label htmlFor="tradeName">Trade Name</Label>
                    <Input
                      id="tradeName"
                      value={vendor.tradeName ?? ""}
                      onChange={(e) =>
                        updateVendorField("tradeName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID</Label>
                    <Input
                      id="taxId"
                      value={vendor.taxId ?? ""}
                      onChange={(e) =>
                        updateVendorField("taxId", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Business Email</Label>
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
                    <Label htmlFor="businessPhone">Business Phone</Label>
                    <Input
                      id="businessPhone"
                      value={vendor.businessPhone ?? ""}
                      onChange={(e) =>
                        updateVendorField("businessPhone", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="countryCode">Country Code</Label>
                    <Input
                      id="countryCode"
                      value={vendor.countryCode ?? ""}
                      onChange={(e) =>
                        updateVendorField("countryCode", e.target.value)
                      }
                      placeholder="e.g. BF"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region / State</Label>
                    <Input
                      id="region"
                      value={vendor.region ?? ""}
                      onChange={(e) =>
                        updateVendorField("region", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={vendor.city ?? ""}
                      onChange={(e) =>
                        updateVendorField("city", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="addressLine1">Address Line 1</Label>
                    <Input
                      id="addressLine1"
                      value={vendor.addressLine1 ?? ""}
                      onChange={(e) =>
                        updateVendorField("addressLine1", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
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
                    Business profile saved.
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
                        Saving…
                      </>
                    ) : (
                      "Save business profile"
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
                      Verification
                    </DashboardCardTitle>
                    <DashboardCardDescription>
                      Track your vendor verification status.
                    </DashboardCardDescription>
                  </div>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
              </DashboardCardHeader>
              <DashboardCardContent className="space-y-4 px-4 py-4">
                {vendor.statusHistory.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Status History
                    </p>
                    <ul className="space-y-2">
                      {vendor.statusHistory.map((entry, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
                        >
                          <span className="font-medium">{entry.status}</span>
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
                    No status history yet.
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
                          Submitting…
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="mr-1 size-4" />
                          Submit for verification
                        </>
                      )}
                    </Button>
                    {submitError ? (
                      <p className="text-destructive text-sm">{submitError}</p>
                    ) : null}
                    {submitSuccess ? (
                      <p className="text-green-600 text-sm">
                        Submitted for verification successfully.
                      </p>
                    ) : null}
                  </div>
                ) : vendorIsApprovedForOperations(vendor.status) ? (
                  <p className="text-green-600 text-sm">
                    Your vendor account is approved and active.
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
                No vendor profile found. Complete onboarding first.
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
                  Documents
                </DashboardCardTitle>
                <DashboardCardDescription>
                  Upload verification documents. Files must be uploaded to
                  storage first — paste the URL here.
                </DashboardCardDescription>
              </DashboardCardHeader>
              <DashboardCardContent className="space-y-4 px-4 py-4">
                {/* Add document form */}
                <div className="grid gap-3 rounded-lg border border-border/60 p-3">
                  <p className="text-xs font-medium">Add new document</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Type</Label>
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
                      <Label className="text-xs">File URL</Label>
                      <Input
                        className="h-9"
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        placeholder="https://storage.example.com/doc.pdf"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">File Name (optional)</Label>
                    <Input
                      className="h-9"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="business_registration.pdf"
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
                          Adding…
                        </>
                      ) : (
                        <>
                          <Upload className="mr-1 size-3.5" />
                          Add document
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Document list */}
                {vendor.documents.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Uploaded documents
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
                                  "Document"}
                              </p>
                              <p className="text-muted-foreground text-[10px]">
                                {DOCUMENT_TYPE_LABELS[doc.type]} ·{" "}
                                {new Date(
                                  doc.createdAt
                                ).toLocaleDateString()}
                                {doc.verifiedAt
                                  ? ` · Verified ${new Date(
                                      doc.verifiedAt
                                    ).toLocaleDateString()}`
                                  : " · Pending verification"}
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
                              title="Remove document"
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
                    No documents uploaded yet.
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
                No vendor profile found. Complete onboarding first.
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
              Preferences
            </DashboardCardTitle>
            <DashboardCardDescription>
              Control what notifications and messages you receive.
            </DashboardCardDescription>
          </DashboardCardHeader>
          <DashboardCardContent className="space-y-4 px-4 py-4">
            {(
              [
                { key: "orderUpdates", label: "Order updates" },
                { key: "promoMessages", label: "Promotional messages" },
                { key: "emailNewsletter", label: "Email newsletter" },
                { key: "pushEnabled", label: "Push notifications" },
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
            {settingsError ? (
              <p className="text-destructive text-sm">{settingsError}</p>
            ) : null}
            {settingsSuccess ? (
              <p className="text-green-600 text-sm">Preferences saved.</p>
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
                    Saving…
                  </>
                ) : (
                  "Save preferences"
                )}
              </Button>
            </div>
          </DashboardCardContent>
        </DashboardCard>
      </TabsContent>
    </Tabs>
  );
}
