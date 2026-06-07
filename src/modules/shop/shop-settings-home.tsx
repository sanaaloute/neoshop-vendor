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

function verificationBadge(status: ShopVerificationStatus) {
  switch (status) {
    case "verified":
      return (
        <Badge className="gap-1 border-green-500/40 bg-green-500/15 font-normal text-green-800 dark:text-green-200">
          <CheckCircle2 className="size-3.5" aria-hidden />
          Verified
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary" className="gap-1 font-normal">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Pending review
        </Badge>
      );
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="outline">Not submitted</Badge>;
  }
}

const navLinks: { id: string; label: string }[] = [
  { id: "shop-profile", label: "Profile" },
  { id: "shop-branding", label: "Logo & banner" },
  { id: "shop-shipping", label: "Shipping" },
  { id: "shop-returns", label: "Returns" },
  { id: "shop-business", label: "Business" },
  { id: "shop-verification", label: "Verification" },
  { id: "shop-payout", label: "Payout" },
];

export function ShopSettingsHome() {
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
      setSaveHint(
        "Saved on this device. Connect to your marketplace to sync to the server."
      );
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
          name: state.profile.shopName || "My Shop",
          slug: state.profile.slug || "my-shop",
          description: state.profile.description || undefined,
        })) as { id?: string } | undefined;
        shopId = created?.id;
        if (!shopId) {
          setSaveHint("Shop was created but no ID was returned.");
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
      setSaveHint(shopId === first?.id ? "Shop settings saved." : "Shop created and saved.");
    } catch (e) {
      setSaveHint(
        httpErrorMessageForUser(
          e,
          "Could not save. Try again or contact support."
        )
      );
    }
    clearSaveHintSoon();
  }, [state, clearSaveHintSoon]);

  const runPreview = useCallback(async () => {
    if (!getApiBaseUrl() || !state.profile.slug) return;
    setPreviewLoading(true);
    try {
      const data = await getShopPublicBySlug(state.profile.slug);
      setPreviewData(data as typeof previewData);
      setPreviewOpen(true);
    } catch (e) {
      setSaveHint(httpErrorMessageForUser(e, "Could not load public preview."));
      clearSaveHintSoon();
    } finally {
      setPreviewLoading(false);
    }
  }, [state.profile.slug, clearSaveHintSoon]);

  const bind =
    <S extends keyof ShopSettingsState>(section: S) =>
    (partial: Partial<ShopSettingsState[S]>) => {
      patch({ [section]: partial } as Partial<ShopSettingsState>);
    };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <nav
          className="flex flex-wrap gap-2 lg:sticky lg:top-24 lg:max-w-[220px] lg:flex-col"
          aria-label="Shop settings sections"
        >
          {navLinks.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className="border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              {l.label}
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
                Save changes
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={reset}
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Reset to defaults
              </Button>
            </div>
            {!hydrated ? (
              <span className="text-muted-foreground text-xs">
                Loading saved settings…
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
                  Shop profile
                </DashboardCardDescription>
                <DashboardCardTitle className="text-base">
                  Public storefront identity
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardContent className="grid gap-4 px-4 py-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="shop-name">Shop name</Label>
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
                    <Label htmlFor="shop-slug">URL slug</Label>
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
                      Preview public page
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
                  <Label htmlFor="shop-tag">Tagline</Label>
                  <Input
                    id="shop-tag"
                    value={state.profile.tagline}
                    onChange={(e) =>
                      bind("profile")({ tagline: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="shop-desc">Description</Label>
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
                  Logo & banner
                </DashboardCardDescription>
                <DashboardCardTitle className="text-base">
                  Visual branding
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardContent className="space-y-6 px-4 py-4">
                <BrandingDrop
                  label="Logo"
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
                  label="Banner"
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
                  Shipping rules
                </DashboardCardDescription>
                <DashboardCardTitle className="text-base">
                  Fulfillment expectations
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardContent className="grid gap-4 px-4 py-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="proc-min">Processing time (min days)</Label>
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
                  <Label htmlFor="proc-max">Processing time (max days)</Label>
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
                    Free shipping threshold (CNY)
                  </Label>
                  <Input
                    id="free-threshold"
                    inputMode="decimal"
                    placeholder="None"
                    value={state.shipping.freeShippingThresholdUsd}
                    onChange={(e) =>
                      bind("shipping")({
                        freeShippingThresholdUsd: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="carriers">Carrier notes</Label>
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
                  Return policy
                </DashboardCardDescription>
                <DashboardCardTitle className="text-base">
                  Buyer-facing rules
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardContent className="grid gap-4 px-4 py-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ret-days">Return window (days)</Label>
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
                  <Label htmlFor="restock">Restocking fee (%)</Label>
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
                  <Label htmlFor="ret-details">Policy details</Label>
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
                  Business details
                </DashboardCardDescription>
                <DashboardCardTitle className="text-base">
                  Legal & support contacts
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardContent className="grid gap-4 px-4 py-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="legal-name">Legal business name</Label>
                  <Input
                    id="legal-name"
                    value={state.business.legalName}
                    onChange={(e) =>
                      bind("business")({ legalName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ein">Tax ID (masked)</Label>
                  <Input
                    id="ein"
                    value={state.business.einMasked}
                    readOnly
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Support email</Label>
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
                  <Label htmlFor="addr1">Address line 1</Label>
                  <Input
                    id="addr1"
                    value={state.business.addressLine1}
                    onChange={(e) =>
                      bind("business")({ addressLine1: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="addr2">Address line 2</Label>
                  <Input
                    id="addr2"
                    value={state.business.addressLine2}
                    onChange={(e) =>
                      bind("business")({ addressLine2: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={state.business.city}
                    onChange={(e) => bind("business")({ city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">State / region</Label>
                  <Input
                    id="region"
                    value={state.business.region}
                    onChange={(e) =>
                      bind("business")({ region: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal">Postal code</Label>
                  <Input
                    id="postal"
                    value={state.business.postalCode}
                    onChange={(e) =>
                      bind("business")({ postalCode: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={state.business.country}
                    onChange={(e) =>
                      bind("business")({ country: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone">Support phone</Label>
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
                  Verification status
                </DashboardCardDescription>
                <DashboardCardTitle className="text-base">
                  Trust & compliance
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardContent className="space-y-4 px-4 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  {verificationBadge(state.verification.status)}
                  {state.verification.submittedAt ? (
                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <Clock className="size-3.5" aria-hidden />
                      Submitted{" "}
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
                  Payout settings
                </DashboardCardDescription>
                <DashboardCardTitle className="text-base">
                  Settlement preferences
                </DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardContent className="grid gap-4 px-4 py-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payout-freq">Payout frequency</Label>
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
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-pay">Minimum payout (CNY)</Label>
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
                    Tax form on file
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
            <SheetTitle>Public shop preview</SheetTitle>
            <SheetDescription>
              How customers see your storefront.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 py-4">
            {previewData ? (
              <div className="space-y-4">
                {previewData.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewData.logoUrl}
                    alt="Shop logo"
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
                    alt="Shop banner"
                    className="rounded-lg object-cover"
                  />
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No public data available for this slug.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}


