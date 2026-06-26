import { create } from "zustand";

import { getApiBaseUrl } from "@/config/auth";
import { getVendorMe } from "@/services/vendor/vendors-api";
import type { VendorMeResponse } from "@/services/vendor/types";

/** Coalesce parallel `load()` calls (shell + gate + bootstrap). */
let loadInFlight: Promise<void> | null = null;

type VendorProfileState = {
  profile: VendorMeResponse | null;
  loading: boolean;
  fetched: boolean;
  /** Load once per session unless `force` (e.g. after submit-verification). */
  load: (opts?: { force?: boolean }) => Promise<void>;
  setProfile: (profile: VendorMeResponse) => void;
  reset: () => void;
};

export const useVendorProfileStore = create<VendorProfileState>((set, get) => ({
  profile: null,
  loading: false,
  fetched: false,

  load: async (opts) => {
    const force = opts?.force === true;
    if (!force && get().fetched) return;
    if (loadInFlight && !force) return loadInFlight;
    if (!getApiBaseUrl()) {
      set({ profile: null, loading: false, fetched: true });
      return;
    }

    const run = async () => {
      set({ loading: true });
      try {
        const profile = await getVendorMe();
        set({ profile, loading: false, fetched: true });
      } catch {
        set({ profile: null, loading: false, fetched: true });
      }
    };

    const promise = run();
    loadInFlight = promise;
    promise.finally(() => {
      if (loadInFlight === promise) loadInFlight = null;
    });
    return promise;
  },

  setProfile: (profile) => set({ profile, loading: false, fetched: true }),

  reset: () => set({ profile: null, loading: false, fetched: false }),
}));
