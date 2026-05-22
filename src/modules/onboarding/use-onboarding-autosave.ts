"use client";

import { useEffect, useRef } from "react";
import type { Control, FieldValues } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { UI_DELAYS } from "@/config/ui";
import type { OnboardingDraft } from "./types";
import {
  type OnboardingSection,
  useOnboardingWizardStore,
} from "@/store/onboarding-wizard-store";

export function useOnboardingAutosave<T extends FieldValues>(
  control: Control<T>,
  section: OnboardingSection
) {
  const values = useWatch({ control });
  const patchSection = useOnboardingWizardStore((s) => s.patchSection);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      patchSection(section, values as Partial<OnboardingDraft[typeof section]>);
    }, UI_DELAYS.AUTOSAVE_DEBOUNCE);
    return () => {
      if (timerRef.current !== undefined) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [values, patchSection, section]);
}
