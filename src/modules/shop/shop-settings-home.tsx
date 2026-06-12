"use client";

import { useCallback, useRef, useState } from "react";
import {
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Loader2,
  RotateCcw,
  Save,
  Shield,
  Store,
  Truck,
} from "lucide-react";
import { useTranslations } from "next-intl";

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardDescription,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/cards/dashboard-card";
import { VendorMuted } from "@/components/layout/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from "@/config/auth";
import { BrandingDrop } from "./branding-drop";
import { useShopGatewayBootstrap } from "@/hooks/use-shop-gateway-bootstrap";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  listMyShops,
  createShop,
  updateShop,
  getShopPublicBySlug,
} from "@/services/vendor/shops-api";

import {
  useShopSettingsHydrated,
  useShopSettingsStore,
} from "@/store/shop-settings-store";

import type { ShopSettingsState, ShopVerificationStatus } from "./types";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });
}

function verificationBadge(status: ShopVerificationStatus, t: (key: string) => string) {
  switch (status) {
    case "verified":
      return (
        <Badge className="gap-1 border-green-500/40 bg-green-500/15 font-normal text-green-800 dark:text-green-200">
          <CheckCircle2 className="size-3.5" aria-hidden />
          {t("shop.verification.verified")}
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary" className="gap-1 font-normal">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          {t("shop.verification.pendingReview")}
        </Badge>
      );
    case "rejected":
      return <Badge variant="destructive">{t("shop.verification.rejected")}</Badge>;
    default:
      return <Badge variant="outline">{t("shop.verification.notSubmitted")}</Badge>;
  }
}

export function ShopSettingsHome() {
  const t = useTranslations();
  useShopGatewayBootstrap();
  const state = useShopSettingsStore((s) => s.data);
  const patch = useShopSettingsStore((s) => s.patch);
  const reset = useShopSettingsStore((s) => s.reset);
  const hydrated = useShopSettingsHydrated();
  const [saveHint, setSaveHint] = useState<string | null>(null);
  const saveHintTimerRef = useRef<number | undefined>(undefined);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    name: string;
    slug: string;
    description?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const clearSaveHintSoon = useCallback(() => {
    if (saveHintTimerRef.current !== undefined) {
      window.clearTimeout(saveHintTimerRef.current);
    }
    saveHintTimerRef.current = window.setTimeout(() => setSaveHint(null), 5000);
  }, []);

  const onSave = useCallback(async () => {
    if (!getApiBaseUrl()) {
      setSaveHint(t("shop.saveHint.localSave"));
      clearSaveHintSoon();
      return;
    }
    try {
      const shops = await listMyShops();
      const list = Array.isArray(shops) ? shops : [];
      const first = list[0] as { id?: string } | undefined;
      let shopId = first?.id;

      if (!shopId) {
        const created = (await createShop({
          name: state.profile.shopName || t("defaultShopName"),
          slug: state.profile.slug || t("defaultShopSlug"),
          description: state.profile.description || undefined,
        })) as { id?: string } | undefined;
        shopId = created?.id;
        if (!shopId) {
          setSaveHint(t("shop.saveHint.noIdReturned"));
          clearSaveHintSoon();
          return;
        }
      }

      await updateShop(shopId, {
        name: state.profile.shopName,
        slug: state.profile.slug,
        description: state.profile.description || undefined,
        logoUrl: state.branding.logoDataUrl?.startsWith("http")
          ? state.branding.logoDataUrl
          : undefined,
        bannerUrl: state.branding.bannerDataUrl?.startsWith("http")
          ? state.branding.bannerDataUrl
          : undefined,
        shippingConfig: {
          processingDaysMin: state.shipping.processingDaysMin,
          processingDaysMax: state.shipping.processingDaysMax,
          freeShippingThresholdUsd: state.shipping.freeShippingThresholdUsd,
          carriersNote: state.shipping.carriersNote,
          returnPolicy: state.returnPolicy,
        },
        paymentConfig: {
          frequency: state.payout.frequency,
          minimumPayoutUsd: state.payout.minimumPayoutUsd,
          taxFormOnFile: state.payout.taxFormOnFile,
        },
      });
      setSaveHint(shopId === first?.id ? t("shop.saveHint.shopSettingsSaved") : t("shop.saveHint.shopCreatedSaved"));
    } catch (e) {
      setSaveHint(
        httpErrorMessageForUser(
          e,
          t("shop.saveHint.couldNotSave")
        )
      );
    }
    clearSaveHintSoon();
  }, [state, clearSaveHintSoon, t]);

  const runPreview = useCallback(async () => {
    if (!getApiBaseUrl() || !state.profile.slug) return;
    setPreviewLoading(true);
    try {
      const data = await getShopPublicBySlug(state.profile.slug);
      setPreviewData(data as typeof previewData);
      setPreviewOpen(true);
    } catch (e) {
      setSaveHint(httpErrorMessageForUser(e, t("shop.saveHint.couldNotLoadPreview")));
      clearSaveHintSoon();
    } finally {
      setPreviewLoading(false);
    }
  }, [state.profile.slug, clearSaveHintSoon, t]);

  const bind =
    <S extends keyof ShopSettingsState>(section: S) =>
    (partial: Partial<ShopSettingsState[S]>) => {
      patch({ [section]: partial } as Partial<ShopSettingsState>);
    };

  const navLinks: { id: string; labelKey: string }[] = [
    { id: "shop-profile", labelKey: "shop.nav.profile" },
    { id: "shop-branding", labelKey: "shop.nav.logoBanner" },
    { id: "shop-shipping", labelKey: "shop.nav.shipping" },
    { id: "shop-returns", labelKey: "shop.nav.returns" },
    { id: "shop-business", labelKey: "shop.nav.business" },
    { id: "shop-verification", labelKey: "shop.nav.verification" },
    { id: "shop-payout", labelKey: "shop.nav.payout" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <nav
          className="flex flex-wrap gap-2 lg:sticky lg:top-24 lg:max-w-[220px] lg:flex-col"
          aria-label={t("shop.nav.ariaLabel")}
        >
          {navLinks.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className="border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              {t(l.labelKey)}
            </a>
          ))}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                onClick={() => void onSave()}
              >
                <Save className="size-3.5" aria-hidden />
                {t("shop.saveChanges")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={reset}
              >
                <RotateCcw className="size-3.5" aria-hidden />
                {t("shop.resetToDefaults")}
              </Button>
            </div>
            {!hydrated ? (
              <span className="text-muted-foreground text-xs">
                {t("shop.loadingSavedSettings")}
              </span>
            ) : saveHint ? (
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                {saveHint}
              </span>
            ) : null}
          </div>

          <section id="shop-profile">
            <DashboardCard className="gap-0 py-0">
              <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
                <DashboardCardDescription className="text-muted-foreground flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase">
                  <Store className="size-3.5" aria-hidden />
                  {t("shop.profile.title")}
                </DashboardCardDescription>
                <DashboardCardTitle className="text-base">
                  {t("shop.profile.description")}
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardContent className="grid gap-4 px-4 py-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="shop-name">{t("shop.profile.shopName")}</Label>
                  <Input
                    id="shop-name"
                    value={state.profile.shopName}
                    onChange={(e) =>
                      bind("profile")({ shopName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="shop-slug">{t("shop.profile.slug")}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto gap-1 px-1 py-0 text-xs"
                      disabled={!state.profile.slug || previewLoading}
                      onClick={() => void runPreview()}
                    >
                      {previewLoading ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <ExternalLink className="size-3" />
                      )}
                      {t("shop.profile.previewPublicPage")}
                    </Button>
                  </div>
                  <Input
                    id="shop-slug"
                    value={state.profile.slug}
                    onChange={(e) =>
                      bind("profile")({
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-")
                          .replace(/-+/g, "-"),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-tag">{t("shop.profile.tagline")}</Label>
                  <Input
                    id="shop-tag"
                    value={state.profile.tagline}
                    onChange={(e) =>
                      bind("profile")({ tagline: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="shop-desc">{t("shop.profile.descriptionLabel")}</Label>
                  <Textarea
                    id="shop-desc"
                    className="min-h-[100px]"
                    value={state.profile.description}
                    onChange={(e) =>
                      bind("profile")({ description: e.target.value })
                    }
                  />
                </div>
              </DashboardCardContent>
            </DashboardCard>
          </section>

          <section id="shop-branding">
            <DashboardCard className="gap-0 py-0">
              <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
                <DashboardCardDescription className="text-muted-foreground flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase">
                  <Camera className="size-3.5" aria-hidden />
                  {t("shop.branding.title")}
                </DashboardCardDescription>
                <DashboardCardTitle className="text-base">
                  {t("shop.branding.description")}
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardContent className="space-y-6 px-4 py-4">
                <BrandingDrop
                  label={t("shop.branding.logo")}
                  preview={state.branding.logoDataUrl}
                  fileName={state.branding.logoFileName}
                  accept="image/png,image/jpeg,image/svg+xml"
                  onPick={async (file) => {
                    const url = await fileToDataUrl(file);
                    bind("branding")({
                      logoDataUrl: url,
                      logoFileName: file.name,
                    });
                  }}
                  onClear={() =>
                    bind("branding")({ logoDataUrl: null, logoFileName: null })
                  }
                />
                <Separator />
                <BrandingDrop
                  label={t("shop.branding.banner")}
                  preview={state.branding.bannerDataUrl}
                  fileName={state.branding.bannerFileName}
                  accept="image/png,image/jpeg"
                  onPick={async (file) => {
                    const url = await fileToDataUrl(file);
                    bind("branding")({
                      bannerDataUrl: url,
                      bannerFileName: file.name,
                    });
                  }}
                  onClear={() =>
                    bind("branding")({
                      bannerDataUrl: null,
                      bannerFileName: null,
                    })
                  }
                  tall
                />
              </DashboardCardContent>
            </DashboardCard>
          </section>

          <section id="shop-shipping">
            <DashboardCard className="gap-0 py-0">
              <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
                <DashboardCardDescription className="text-muted-foreground flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase">
                  <Truck className="size-3.5" aria-hidden />
                  {t("shop.shipping.title")}
                </DashboardCardDescription>
                <DashboardCardTitle className="text-base">
                  {t("shop.shipping.description")}
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardContent className="grid gap-4 px-4 py-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="proc-min">{t("shop.shipping.processingMin")}</Label>
                  <Input
                    id="proc-min"
                    type="number"
                    min={0}
                    value={state.shipping.processingDaysMin}
                    onChange={(e) =>
                      bind("shipping")({
                        processingDaysMin: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proc-max">{t("shop.shipping.processingMax")}</Label>
                  <Input
                    id="proc-max"
                    type="number"
                    min={0}
                    value={state.shipping.processingDaysMax}
                    onChange={(e) =>
                      bind("shipping")({
                        processingDaysMax: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="free-threshold">
                    {t("shop.shipping.freeThreshold")}
                  </Label>
                  <Input
                    id="free-threshold"
                    inputMode="decimal"
                    placeholder={t("shop.shipping.freeThresholdPlaceholder")}
                    value={state.shipping.freeShippingThresholdUsd}
                    onChange={(e) =>
                      bind("shipping")({
                        freeShippingThresholdUsd: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="carriers">{t("shop.shipping.carrierNotes")}</Label>
                  <Textarea
                    id="carriers"
                    value={state.shipping.carriersNote}
                    onChange={(e) =>
                      bind("shipping")({ carriersNote: e.target.value })
                    }
                  />
                </div>
              </DashboardCardContent>
            </DashboardCard>
          </section>

          <section id="shop-returns">
            <DashboardCard className="gap-0 py-0">
              <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
                <DashboardCardDescription className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                  {t("shop.returns.title")}
                </DashboardCardDescription>
                <DashboardCardTitle className="text-base">
                  {t("shop.returns.description")}
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardContent className="grid gap-4 px-4 py-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ret-days">{t("shop.returns.windowDays")}</Label>
                  <Input
                    id="ret-days"
                    type="number"
                    min={0}
                    value={state.returnPolicy.windowDays}
                    onChange={(e) =>
                      bind("returnPolicy")({
                        windowDays: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restock">{t("shop.returns.restockingFee")}</Label>
                  <Input
                    id="restock"
                    type="number"
                    min={0}
                    max={100}
                    value={state.returnPolicy.restockingFeePercent}
                    onChange={(e) =>
                      bind("returnPolicy")({
                        restockingFeePercent: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ret-details">{t("shop.returns.policyDetails")}</Label>
                  <Textarea
                    id="ret-details"
                    className="min-h-[120px]"
                    value={state.returnPolicy.details}
                    onChange={(e) =>
                      bind("returnPolicy")({ details: e.target.value })
                    }
                  />
                </div>
              </DashboardCardContent>
            </DashboardCard>
          </section>

          <section id="shop-business">
            <DashboardCard className="gap-0 py-0">
              <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
                <DashboardCardDescription className="text-muted-foreground flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase">
                  <Building2 className="size-3.5" aria-hidden />
                  {t("shop.business.title")}
                </DashboardCardDescription>
                <DashboardCardTitle className="text-base">
                  {t("shop.business.description")}
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardContent className="grid gap-4 px-4 py-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="legal-name">{t("shop.business.legalName")}</Label>
                  <Input
                    id="legal-name"
                    value={state.business.legalName}
                    onChange={(e) =>
                      bind("business")({ legalName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ein">{t("shop.business.taxId")}</Label>
                  <Input
                    id="ein"
                    value={state.business.einMasked}
                    readOnly
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">{t("shop.business.supportEmail")}</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={state.business.supportEmail}
                    onChange={(e) =>
                      bind("business")({ supportEmail: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="addr1">{t("shop.business.address1")}</Label>
                  <Input
                    id="addr1"
                    value={state.business.addressLine1}
                    onChange={(e) =>
                      bind("business")({ addressLine1: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="addr2">{t("shop.business.address2")}</Label>
                  <Input
                    id="addr2"
                    value={state.business.addressLine2}
                    onChange={(e) =>
                      bind("business")({ addressLine2: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{t("shop.business.city")}</Label>
                  <Input
                    id="city"
                    value={state.business.city}
                    onChange={(e) => bind("business")({ city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">{t("shop.business.region")}</Label>
                  <Input
                    id="region"
                    value={state.business.region}
                    onChange={(e) =>
                      bind("business")({ region: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal">{t("shop.business.postalCode")}</Label>
                  <Input
                    id="postal"
                    value={state.business.postalCode}
                    onChange={(e) =>
                      bind("business")({ postalCode: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">{t("shop.business.country")}</Label>
                  <Input
                    id="country"
                    value={state.business.country}
                    onChange={(e) =>
                      bind("business")({ country: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone">{t("shop.business.supportPhone")}</Label>
                  <Input
                    id="phone"
                    value={state.business.supportPhone}
                    onChange={(e) =>
                      bind("business")({ supportPhone: e.target.value })
                    }
                  />
                </div>
              </DashboardCardContent>
            </DashboardCard>
          </section>

          <section id="shop-verification">
            <DashboardCard className="gap-0 py-0">
              <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
                <DashboardCardDescription className="text-muted-foreground flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase">
                  <Shield className="size-3.5" aria-hidden />
                  {t("shop.verification.title")}
                </DashboardCardDescription>
                <DashboardCardTitle className="text-base">
                  {t("shop.verification.description")}
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardContent className="space-y-4 px-4 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  {verificationBadge(state.verification.status, t)}
                  {state.verification.submittedAt ? (
                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <Clock className="size-3.5" aria-hidden />
                      {t("shop.verification.submitted")}{" "}
                      {new Date(
                        state.verification.submittedAt
                      ).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
                <VendorMuted className="text-sm">
                  {state.verification.reviewerNote}
                </VendorMuted>
              </DashboardCardContent>
            </DashboardCard>
          </section>

          <section id="shop-payout">
            <DashboardCard className="gap-0 py-0">
              <DashboardCardHeader className="border-border/50 border-b px-4 py-3">
                <DashboardCardDescription className="text-muted-foreground flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase">
                  <CreditCard className="size-3.5" aria-hidden />
                  {t("shop.payout.title")}
                </DashboardCardDescription>
                <DashboardCardTitle className="text-base">
                  {t("shop.payout.description")}
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardContent className="grid gap-4 px-4 py-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payout-freq">{t("shop.payout.frequency")}</Label>
                  <select
                    id="payout-freq"
                    className={cn(
                      "border-input flex h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none",
                      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
                      "dark:bg-input/30"
                    )}
                    value={state.payout.frequency}
                    onChange={(e) =>
                      bind("payout")({
                        frequency: e.target
                          .value as ShopSettingsState["payout"]["frequency"],
                      })
                    }
                  >
                    <option value="weekly">{t("shop.payout.weekly")}</option>
                    <option value="biweekly">{t("shop.payout.biweekly")}</option>
                    <option value="monthly">{t("shop.payout.monthly")}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-pay">{t("shop.payout.minimumPayout")}</Label>
                  <Input
                    id="min-pay"
                    inputMode="decimal"
                    value={state.payout.minimumPayoutUsd}
                    onChange={(e) =>
                      bind("payout")({ minimumPayoutUsd: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <input
                    id="tax-form"
                    type="checkbox"
                    className="border-input accent-primary size-4 rounded"
                    checked={state.payout.taxFormOnFile}
                    onChange={(e) =>
                      bind("payout")({ taxFormOnFile: e.target.checked })
                    }
                  />
                  <Label htmlFor="tax-form" className="font-normal">
                    {t("shop.payout.taxFormOnFile")}
                  </Label>
                </div>
              </DashboardCardContent>
            </DashboardCard>
          </section>
        </div>
      </div>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t("shop.preview.title")}</SheetTitle>
            <SheetDescription>
              {t("shop.preview.description")}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 py-4">
            {previewData ? (
              <div className="space-y-4">
                {previewData.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewData.logoUrl}
                    alt={t("shop.branding.logoAlt")}
                    className="max-h-24 rounded-lg object-contain"
                  />
                ) : null}
                <div>
                  <h3 className="text-lg font-semibold">{previewData.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {previewData.slug}
                  </p>
                </div>
                {previewData.description ? (
                  <p className="text-sm">{previewData.description}</p>
                ) : null}
                {previewData.bannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewData.bannerUrl}
                    alt={t("shop.branding.bannerAlt")}
                    className="rounded-lg object-cover"
                  />
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {t("shop.preview.noData")}
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
