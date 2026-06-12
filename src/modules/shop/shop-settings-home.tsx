"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { motion, AnimatePresence } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from "@/config/auth";
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
const easeOutExpo = [0.22, 1, 0.36, 1] as const;

import { SettingsSectionCard } from "./settings-section-card";
import { SettingsField } from "./settings-field";
import { BrandingDrop } from "./branding-drop";
import { useShopGatewayBootstrap } from "@/hooks/use-shop-gateway-bootstrap";

import type { ShopSettingsState, ShopVerificationStatus } from "./types";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });
}

function verificationBadge(
  status: ShopVerificationStatus,
  t: (key: string) => string
) {
  switch (status) {
    case "verified":
      return (
        <Badge className="gap-1.5 border-green-500/30 bg-green-500/10 px-2.5 py-1 font-medium text-green-700 dark:text-green-300">
          <CheckCircle2 className="size-3.5" aria-hidden />
          {t("shop.verification.verified")}
        </Badge>
      );
    case "pending":
      return (
        <Badge
          variant="secondary"
          className="gap-1.5 px-2.5 py-1 font-medium"
        >
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          {t("shop.verification.pendingReview")}
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="px-2.5 py-1 font-medium">
          {t("shop.verification.rejected")}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="px-2.5 py-1 font-medium">
          {t("shop.verification.notSubmitted")}
        </Badge>
      );
  }
}

/* ── Nav Pill ── */
function NavPill({
  links,
  activeId,
  ariaLabel,
}: {
  links: { id: string; label: string; icon: React.ReactNode }[];
  activeId: string;
  ariaLabel: string;
}) {
  return (
    <nav className="flex flex-col gap-1" aria-label={ariaLabel}>
      {links.map((l) => {
        const active = activeId === l.id;
        return (
          <a
            key={l.id}
            href={`#${l.id}`}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              active
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "transition-colors",
                active ? "text-primary" : "text-muted-foreground/70"
              )}
            >
              {l.icon}
            </span>
            {l.label}
            {active ? (
              <motion.div
                layoutId="shop-nav-indicator"
                className="bg-primary ml-auto size-1.5 rounded-full"
                transition={{ duration: 0.25, ease: easeOutExpo }}
              />
            ) : null}
          </a>
        );
      })}
    </nav>
  );
}

/* ── Floating Save Bar ── */
function FloatingSaveBar({
  onSave,
  onReset,
  saving,
  hint,
  visible,
  labels,
}: {
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
  hint: string | null;
  visible: boolean;
  labels: {
    unsavedChanges: string;
    reset: string;
    saving: string;
    saveChanges: string;
  };
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.3, ease: easeOutExpo }}
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border/60 bg-card/90 px-5 py-3 shadow-2xl shadow-black/20 ring-1 ring-white/5 backdrop-blur-xl dark:shadow-black/40"
        >
          <div className="flex items-center gap-2">
            <div className="bg-primary/15 flex size-8 items-center justify-center rounded-full">
              <Store className="text-primary size-4" />
            </div>
            <span className="text-sm font-medium">
              {labels.unsavedChanges}
            </span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={onReset}
              disabled={saving}
            >
              <RotateCcw className="size-3.5" />
              {labels.reset}
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5 rounded-xl"
              onClick={() => void onSave()}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              {saving ? labels.saving : labels.saveChanges}
            </Button>
          </div>
          {hint ? (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "text-xs font-medium",
                hint.includes("Saved") || hint.includes("created")
                  ? "text-green-600 dark:text-green-400"
                  : "text-destructive"
              )}
            >
              {hint}
            </motion.span>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Main Component ── */
export function ShopSettingsHome() {
  const t = useTranslations();
  useShopGatewayBootstrap();
  const state = useShopSettingsStore((s) => s.data);
  const patch = useShopSettingsStore((s) => s.patch);
  const reset = useShopSettingsStore((s) => s.reset);
  const hydrated = useShopSettingsHydrated();

  const [saveHint, setSaveHint] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const saveHintTimerRef = useRef<number | undefined>(undefined);
  const [activeSection, setActiveSection] = useState("shop-profile");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    name: string;
    slug: string;
    description?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  /* Track active section via IntersectionObserver */
  useEffect(() => {
    const sections = [
      "shop-profile",
      "shop-branding",
      "shop-shipping",
      "shop-returns",
      "shop-business",
      "shop-verification",
      "shop-payout",
    ];
    const observers: IntersectionObserver[] = [];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const clearSaveHintSoon = useCallback(() => {
    if (saveHintTimerRef.current !== undefined) {
      window.clearTimeout(saveHintTimerRef.current);
    }
    saveHintTimerRef.current = window.setTimeout(() => setSaveHint(null), 5000);
  }, []);

  const onSave = useCallback(async () => {
    setSaving(true);
    if (!getApiBaseUrl()) {
      setSaveHint(t("shop.saveHint.localSave"));
      clearSaveHintSoon();
      setSaving(false);
      return;
    }
    try {
      const shops = await listMyShops();
      const list = Array.isArray(shops) ? shops : [];
      const first = list[0] as { id?: string } | undefined;
      let shopId = first?.id;

      if (!shopId) {
        const created = (await createShop({
          name: state.profile.shopName || t("shop.profile.defaultShopName"),
          slug: state.profile.slug || t("defaultShopSlug"),
          description: state.profile.description || undefined,
        })) as { id?: string } | undefined;
        shopId = created?.id;
        if (!shopId) {
          setSaveHint(t("shop.saveHint.noIdReturned"));
          clearSaveHintSoon();
          setSaving(false);
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
      setSaveHint(
        shopId === first?.id
          ? t("shop.saveHint.shopSettingsSaved")
          : t("shop.saveHint.shopCreatedSaved")
      );
    } catch (e) {
      setSaveHint(
        httpErrorMessageForUser(e, t("shop.saveHint.couldNotSave"))
      );
    }
    setSaving(false);
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
      setSaveHint(
        httpErrorMessageForUser(e, t("shop.saveHint.couldNotLoadPreview"))
      );
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

  const navLinks = [
    {
      id: "shop-profile",
      label: t("shop.nav.profile"),
      icon: <Store className="size-4" />,
    },
    {
      id: "shop-branding",
      label: t("shop.nav.logoBanner"),
      icon: <Camera className="size-4" />,
    },
    {
      id: "shop-shipping",
      label: t("shop.nav.shipping"),
      icon: <Truck className="size-4" />,
    },
    {
      id: "shop-returns",
      label: t("shop.nav.returns"),
      icon: <RotateCcw className="size-4" />,
    },
    {
      id: "shop-business",
      label: t("shop.nav.business"),
      icon: <Building2 className="size-4" />,
    },
    {
      id: "shop-verification",
      label: t("shop.nav.verification"),
      icon: <Shield className="size-4" />,
    },
    {
      id: "shop-payout",
      label: t("shop.nav.payout"),
      icon: <CreditCard className="size-4" />,
    },
  ];

  
  return (
    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* ── Sticky Sidebar Nav ── */}
      <aside className="lg:sticky lg:top-24 lg:w-60 lg:shrink-0">
        <div className="bg-card/50 border-border/60 rounded-2xl border p-3 shadow-sm backdrop-blur-sm">
          <NavPill links={navLinks} activeId={activeSection} ariaLabel={t("shop.nav.ariaLabel")} />
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        {/* Status Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOutExpo }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-gradient-to-r from-primary/5 via-transparent to-chart-2/5 px-5 py-3.5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="bg-primary/15 flex size-10 items-center justify-center rounded-xl">
              <Store className="text-primary size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {state.profile.shopName || t("shop.profile.defaultShopName")}
              </p>
              <p className="text-muted-foreground text-xs">
                {state.profile.slug
                  ? `neoshop.com/shop/${state.profile.slug}`
                  : t("shop.profile.slug")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!hydrated ? (
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Loader2 className="size-3.5 animate-spin" />
                {t("shop.loadingSavedSettings")}
              </span>
            ) : saveHint ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "text-xs font-medium",
                  saveHint.includes("Saved") || saveHint.includes("created")
                    ? "text-green-600 dark:text-green-400"
                    : "text-destructive"
                )}
              >
                {saveHint}
              </motion.span>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-lg"
              disabled={!state.profile.slug || previewLoading}
              onClick={() => void runPreview()}
            >
              {previewLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ExternalLink className="size-3.5" />
              )}
              {t("shop.profile.previewPublicPage")}
            </Button>
          </div>
        </motion.div>

        {/* ── Profile ── */}
        <SettingsSectionCard
          id="shop-profile"
          index={0}
          icon={<Store className="size-4" />}
          overline={t("shop.profile.title")}
          title={t("shop.profile.description")}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <SettingsField
              label={t("shop.profile.shopName")}
              htmlFor="shop-name"
              fullWidth
            >
              <Input
                id="shop-name"
                value={state.profile.shopName}
                onChange={(e) =>
                  bind("profile")({ shopName: e.target.value })
                }
                className="h-10"
              />
            </SettingsField>

            <SettingsField
              label={t("shop.profile.slug")}
              htmlFor="shop-slug"
            >
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
                className="h-10"
              />
            </SettingsField>

            <SettingsField
              label={t("shop.profile.tagline")}
              htmlFor="shop-tag"
            >
              <Input
                id="shop-tag"
                value={state.profile.tagline}
                onChange={(e) =>
                  bind("profile")({ tagline: e.target.value })
                }
                className="h-10"
              />
            </SettingsField>

            <SettingsField
              label={t("shop.profile.descriptionLabel")}
              htmlFor="shop-desc"
              fullWidth
            >
              <Textarea
                id="shop-desc"
                className="min-h-[110px] resize-y"
                value={state.profile.description}
                onChange={(e) =>
                  bind("profile")({ description: e.target.value })
                }
              />
            </SettingsField>
          </div>
        </SettingsSectionCard>

        {/* ── Branding ── */}
        <SettingsSectionCard
          id="shop-branding"
          index={1}
          icon={<Camera className="size-4" />}
          overline={t("shop.branding.title")}
          title={t("shop.branding.description")}
        >
          <div className="space-y-6">
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
            <Separator className="bg-border/40" />
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
          </div>
        </SettingsSectionCard>

        {/* ── Shipping ── */}
        <SettingsSectionCard
          id="shop-shipping"
          index={2}
          icon={<Truck className="size-4" />}
          overline={t("shop.shipping.title")}
          title={t("shop.shipping.description")}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <SettingsField
              label={t("shop.shipping.processingMin")}
              htmlFor="proc-min"
            >
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
                className="h-10"
              />
            </SettingsField>
            <SettingsField
              label={t("shop.shipping.processingMax")}
              htmlFor="proc-max"
            >
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
                className="h-10"
              />
            </SettingsField>
            <SettingsField
              label={t("shop.shipping.freeThreshold")}
              htmlFor="free-threshold"
            >
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
                className="h-10"
              />
            </SettingsField>
            <SettingsField
              label={t("shop.shipping.carrierNotes")}
              htmlFor="carriers"
              fullWidth
            >
              <Textarea
                id="carriers"
                value={state.shipping.carriersNote}
                onChange={(e) =>
                  bind("shipping")({ carriersNote: e.target.value })
                }
              />
            </SettingsField>
          </div>
        </SettingsSectionCard>

        {/* ── Returns ── */}
        <SettingsSectionCard
          id="shop-returns"
          index={3}
          icon={<RotateCcw className="size-4" />}
          overline={t("shop.returns.title")}
          title={t("shop.returns.description")}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <SettingsField
              label={t("shop.returns.windowDays")}
              htmlFor="ret-days"
            >
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
                className="h-10"
              />
            </SettingsField>
            <SettingsField
              label={t("shop.returns.restockingFee")}
              htmlFor="restock"
            >
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
                className="h-10"
              />
            </SettingsField>
            <SettingsField
              label={t("shop.returns.policyDetails")}
              htmlFor="ret-details"
              fullWidth
            >
              <Textarea
                id="ret-details"
                className="min-h-[120px] resize-y"
                value={state.returnPolicy.details}
                onChange={(e) =>
                  bind("returnPolicy")({ details: e.target.value })
                }
              />
            </SettingsField>
          </div>
        </SettingsSectionCard>

        {/* ── Business ── */}
        <SettingsSectionCard
          id="shop-business"
          index={4}
          icon={<Building2 className="size-4" />}
          overline={t("shop.business.title")}
          title={t("shop.business.description")}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <SettingsField
              label={t("shop.business.legalName")}
              htmlFor="legal-name"
              fullWidth
            >
              <Input
                id="legal-name"
                value={state.business.legalName}
                onChange={(e) =>
                  bind("business")({ legalName: e.target.value })
                }
                className="h-10"
              />
            </SettingsField>
            <SettingsField label={t("shop.business.taxId")} htmlFor="ein">
              <Input
                id="ein"
                value={state.business.einMasked}
                readOnly
                className="bg-muted/40 h-10"
              />
            </SettingsField>
            <SettingsField
              label={t("shop.business.supportEmail")}
              htmlFor="support-email"
            >
              <Input
                id="support-email"
                type="email"
                value={state.business.supportEmail}
                onChange={(e) =>
                  bind("business")({ supportEmail: e.target.value })
                }
                className="h-10"
              />
            </SettingsField>
            <SettingsField
              label={t("shop.business.address1")}
              htmlFor="addr1"
              fullWidth
            >
              <Input
                id="addr1"
                value={state.business.addressLine1}
                onChange={(e) =>
                  bind("business")({ addressLine1: e.target.value })
                }
                className="h-10"
              />
            </SettingsField>
            <SettingsField
              label={t("shop.business.address2")}
              htmlFor="addr2"
              fullWidth
            >
              <Input
                id="addr2"
                value={state.business.addressLine2}
                onChange={(e) =>
                  bind("business")({ addressLine2: e.target.value })
                }
                className="h-10"
              />
            </SettingsField>
            <SettingsField label={t("shop.business.city")} htmlFor="city">
              <Input
                id="city"
                value={state.business.city}
                onChange={(e) =>
                  bind("business")({ city: e.target.value })
                }
                className="h-10"
              />
            </SettingsField>
            <SettingsField label={t("shop.business.region")} htmlFor="region">
              <Input
                id="region"
                value={state.business.region}
                onChange={(e) =>
                  bind("business")({ region: e.target.value })
                }
                className="h-10"
              />
            </SettingsField>
            <SettingsField
              label={t("shop.business.postalCode")}
              htmlFor="postal"
            >
              <Input
                id="postal"
                value={state.business.postalCode}
                onChange={(e) =>
                  bind("business")({ postalCode: e.target.value })
                }
                className="h-10"
              />
            </SettingsField>
            <SettingsField
              label={t("shop.business.country")}
              htmlFor="country"
            >
              <Input
                id="country"
                value={state.business.country}
                onChange={(e) =>
                  bind("business")({ country: e.target.value })
                }
                className="h-10"
              />
            </SettingsField>
            <SettingsField
              label={t("shop.business.supportPhone")}
              htmlFor="phone"
              fullWidth
            >
              <Input
                id="phone"
                value={state.business.supportPhone}
                onChange={(e) =>
                  bind("business")({ supportPhone: e.target.value })
                }
                className="h-10"
              />
            </SettingsField>
          </div>
        </SettingsSectionCard>

        {/* ── Verification ── */}
        <SettingsSectionCard
          id="shop-verification"
          index={5}
          icon={<Shield className="size-4" />}
          overline={t("shop.verification.title")}
          title={t("shop.verification.description")}
        >
          <div className="space-y-4">
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
            {state.verification.reviewerNote ? (
              <div className="bg-muted/30 rounded-lg border border-border/40 p-3">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {state.verification.reviewerNote}
                </p>
              </div>
            ) : null}
          </div>
        </SettingsSectionCard>

        {/* ── Payout ── */}
        <SettingsSectionCard
          id="shop-payout"
          index={6}
          icon={<CreditCard className="size-4" />}
          overline={t("shop.payout.title")}
          title={t("shop.payout.description")}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <SettingsField
              label={t("shop.payout.frequency")}
              htmlFor="payout-freq"
            >
              <Select
                value={state.payout.frequency}
                onValueChange={(v) =>
                  bind("payout")({
                    frequency: v as ShopSettingsState["payout"]["frequency"],
                  })
                }
              >
                <SelectTrigger id="payout-freq" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">
                    {t("shop.payout.weekly")}
                  </SelectItem>
                  <SelectItem value="biweekly">
                    {t("shop.payout.biweekly")}
                  </SelectItem>
                  <SelectItem value="monthly">
                    {t("shop.payout.monthly")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </SettingsField>
            <SettingsField
              label={t("shop.payout.minimumPayout")}
              htmlFor="min-pay"
            >
              <Input
                id="min-pay"
                inputMode="decimal"
                value={state.payout.minimumPayoutUsd}
                onChange={(e) =>
                  bind("payout")({ minimumPayoutUsd: e.target.value })
                }
                className="h-10"
              />
            </SettingsField>
            <div className="flex items-start gap-3 sm:col-span-2">
              <Checkbox
                id="tax-form"
                checked={state.payout.taxFormOnFile}
                onCheckedChange={(checked) =>
                  bind("payout")({ taxFormOnFile: checked === true })
                }
              />
              <div className="space-y-1">
                <Label htmlFor="tax-form" className="text-sm font-medium">
                  {t("shop.payout.taxFormOnFile")}
                </Label>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {t("shop.payout.taxFormHint")}
                </p>
              </div>
            </div>
          </div>
        </SettingsSectionCard>
      </div>

      {/* ── Floating Save Bar ── */}
      <FloatingSaveBar
        onSave={onSave}
        onReset={reset}
        saving={saving}
        hint={saveHint}
        visible={hydrated}
        labels={{
          unsavedChanges: t("shop.unsavedChanges"),
          reset: t("shop.reset"),
          saving: t("shop.saving"),
          saveChanges: t("shop.saveChanges"),
        }}
      />

      {/* ── Preview Sheet ── */}
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
