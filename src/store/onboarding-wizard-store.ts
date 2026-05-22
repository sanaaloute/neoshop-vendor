"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { OnboardingDraft } from "@/modules/onboarding/types";
import { emptyOnboardingDraft } from "@/modules/onboarding/types";

export type OnboardingSection = keyof OnboardingDraft;

type OnboardingWizardState = {
  step: number;
  draft: OnboardingDraft;
  /** Created shop id after Shop step (for PATCH shipping/payment). */
  shopId: string | null;
  apiBusy: boolean;
  setStep: (step: number) => void;
  setShopId: (id: string | null) => void;
  setApiBusy: (busy: boolean) => void;
  patchSection: <K extends OnboardingSection>(
    section: K,
    partial: Partial<OnboardingDraft[K]>
  ) => void;
  replaceDraft: (draft: OnboardingDraft) => void;
  resetWizard: () => void;
};

export const useOnboardingWizardStore = create<OnboardingWizardState>()(
  persist(
    (set) => ({
      step: 0,
      draft: emptyOnboardingDraft(),
      shopId: null,
      apiBusy: false,

      setStep: (step) =>
        set(() => ({
          step: Math.max(0, Math.min(6, step)),
        })),

      setShopId: (shopId) => set({ shopId }),

      setApiBusy: (apiBusy) => set({ apiBusy }),

      patchSection: (section, partial) =>
        set((s) => ({
          draft: {
            ...s.draft,
            [section]: { ...s.draft[section], ...partial },
          },
        })),

      replaceDraft: (draft) => set({ draft }),

      resetWizard: () =>
        set({
          step: 0,
          draft: emptyOnboardingDraft(),
          shopId: null,
          apiBusy: false,
        }),
    }),
    {
      name: "neoshop-vendor-onboarding-wizard",
      version: 3,
      partialize: (s) => ({ step: s.step, draft: s.draft, shopId: s.shopId }),
      migrate: (persisted, fromVersion) => {
        if (fromVersion < 2) {
          const o = persisted as {
            step?: number;
            draft?: OnboardingDraft;
            shopId?: string | null;
          };
          const draft = o.draft ?? emptyOnboardingDraft();
          return {
            step: o.step ?? 0,
            draft: {
              ...draft,
              documents: {
                ...draft.documents,
                fileUrls: draft.documents.fileUrls ?? [],
              },
            },
            shopId: o.shopId ?? null,
          };
        }
        if (fromVersion < 3) {
          const o = persisted as {
            step?: number;
            draft?: OnboardingDraft;
            shopId?: string | null;
          };
          const draft = o.draft ?? emptyOnboardingDraft();
          const business = draft.business as Partial<
            OnboardingDraft["business"]
          >;
          return {
            step: o.step ?? 0,
            draft: {
              ...draft,
              business: {
                ...emptyOnboardingDraft().business,
                ...business,
                businessEmail: business.businessEmail ?? "",
                businessPhone: business.businessPhone ?? "",
              },
            },
            shopId: o.shopId ?? null,
          };
        }
        return persisted as {
          step: number;
          draft: OnboardingDraft;
          shopId: string | null;
        };
      },
    }
  )
);
