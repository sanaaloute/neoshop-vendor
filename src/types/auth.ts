import type {
  VendorPermission,
  VendorTeamRole,
} from "@/lib/vendor-permissions";

export type VendorUser = {
  id: string;
  email: string;
  role: string;
  /** Tenant membership role; defaults to owner when omitted (JWT / API). */
  teamRole?: VendorTeamRole;
  /** Effective permissions when backend sends an explicit list */
  permissions?: VendorPermission[];
  /** Backend may omit until onboarding completes */
  onboardingComplete?: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
};

/** Vendor self-service signup — same response shape as login when tokens are issued immediately. */
export type RegisterRequest = LoginRequest;

/** Raw gateway response (supports both camelCase and Supabase snake_case). */
export type LoginResponse = {
  // camelCase (gateway wrapper)
  accessToken?: string;
  refreshToken?: string;
  // snake_case (Supabase native)
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: VendorUser;
};

/** Normalize a login/refresh response to camelCase. */
export function normalizeAuthResponse<T extends LoginResponse>(res: T) {
  return {
    accessToken: res.accessToken ?? res.access_token ?? "",
    refreshToken: res.refreshToken ?? res.refresh_token ?? "",
    user: res.user,
  };
}

export type RefreshResponse = LoginResponse;
