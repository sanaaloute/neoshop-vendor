"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { VendorMeResponse, VendorType } from "@/services/vendor/types";
import type { DraftDocument } from "@/modules/onboarding/types";
import { emptyOnboardingDraft } from "@/modules/onboarding/types";

type OnboardingWizardState = {
  step: number;
  draft: ReturnType<typeof emptyOnboardingDraft>;
  apiBusy: boolean;
  registered: boolean; // true after first POST /vendors/me/register
  setStep: (step: number) => void;
  setApiBusy: (busy: boolean) => void;
  setRegistered: (registered: boolean) => void;
  patchBasicInfo: (partial: Partial<OnboardingWizardState["draft"]["basicInfo"]>) => void;
  patchAddressInfo: (partial: Partial<OnboardingWizardState["draft"]["addressInfo"]>) => void;
  setVendorType: (type: VendorType) => void;
  addDocument: (doc: DraftDocument) => void;
  updateDocument: (id: string, updates: Partial<DraftDocument>) => void;
  removeDocument: (id: string) => void;
  setAcceptedTerms: (accepted: boolean) => void;
  replaceDraft: (draft: OnboardingWizardState["draft"]) => void;
  resetWizard: () => void;
  hydrateFromProfile: (profile: VendorMeResponse) => void;
};

export const useOnboardingWizardStore = create<OnboardingWizardState>()(
  persist(
    (set) => ({
      step: 0,
      draft: emptyOnboardingDraft(),
      apiBusy: false,
      registered: false,

      setStep: (step) =>
        set(() => ({
          step: Math.max(0, Math.min(3, step)),
        })),

      setApiBusy: (apiBusy) => set({ apiBusy }),

      setRegistered: (registered) => set({ registered }),

      patchBasicInfo: (partial) =>
        set((s) => ({
          draft: {
            ...s.draft,
            basicInfo: { ...s.draft.basicInfo, ...partial },
          },
        })),

      patchAddressInfo: (partial) =>
        set((s) => ({
          draft: {
            ...s.draft,
            addressInfo: { ...s.draft.addressInfo, ...partial },
          },
        })),

      setVendorType: (type) =>
        set((s) => ({
          draft: { ...s.draft, vendorType: type },
        })),

      addDocument: (doc) =>
        set((s) => ({
          draft: {
            ...s.draft,
            documents: [...s.draft.documents, doc],
          },
        })),

      updateDocument: (id, updates) =>
        set((s) => ({
          draft: {
            ...s.draft,
            documents: s.draft.documents.map((d) =>
              d.id === id ? { ...d, ...updates } : d
            ),
          },
        })),

      removeDocument: (id) =>
        set((s) => ({
          draft: {
            ...s.draft,
            documents: s.draft.documents.filter((d) => d.id !== id),
          },
        })),

      setAcceptedTerms: (accepted) =>
        set((s) => ({
          draft: { ...s.draft, acceptedTerms: accepted },
        })),

      replaceDraft: (draft) => set({ draft }),

      resetWizard: () =>
        set({
          step: 0,
          draft: emptyOnboardingDraft(),
          apiBusy: false,
          registered: false,
        }),

      hydrateFromProfile: (profile) =>
        set({
          draft: {
            vendorType: profile.vendorType ?? "",
            basicInfo: {
              legalBusinessName: profile.legalBusinessName ?? "",
              tradeName: profile.tradeName ?? "",
              businessEmail: profile.businessEmail ?? "",
              businessPhone: profile.businessPhone ?? "",
              countryCode: profile.countryCode ?? "",
            },
            addressInfo: {
              region: profile.region ?? "",
              city: profile.city ?? "",
              addressLine1: profile.addressLine1 ?? "",
              postalCode: profile.postalCode ?? "",
            },
            documents: profile.documents.map((d) => ({
              id: d.id,
              type: d.type,
              fileUrl: d.fileUrl,
              fileName: d.fileName ?? "document",
              mimeType: d.mimeType ?? "application/pdf",
              status: "done" as const,
            })),
            acceptedTerms: false,
          },
          registered: true,
          step: 0,
        }),
    }),
    {
      name: "neoshop-vendor-onboarding-wizard",
      version: 4,
      partialize: (s) => ({
        step: s.step,
        draft: s.draft,
        registered: s.registered,
      }),
      migrate: () => {
        // Version 4 is a clean break — old 7-step draft shapes are incompatible.
        return {
          step: 0,
          draft: emptyOnboardingDraft(),
          registered: false,
        };
      },
    }
  )
);
