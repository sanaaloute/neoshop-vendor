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

export type RegisterRequest = {
  email: string;
  password: string;
  name?: string;
  surname?: string;
};

export type RegisterResponse = {
  success: boolean;
  message: string;
  user?: {
    userId: string;
    supabaseUserId: string;
    email: string;
    role: string;
  };
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

/** Raw gateway response (supports both camelCase and Supabase snake_case). */
export type LoginResponse = {
  // camelCase (gateway wrapper)
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
  expiresIn?: number;
  expiresAt?: number;
  // snake_case (Supabase native)
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user?: VendorUser;
};

/** Normalize a login/refresh response to camelCase. */
export function normalizeAuthResponse<T extends LoginResponse>(res: T) {
  return {
    accessToken: res.accessToken ?? res.access_token ?? "",
    refreshToken: res.refreshToken ?? res.refresh_token ?? "",
    sessionId: res.sessionId ?? "",
    expiresIn: res.expiresIn ?? res.expires_in ?? 0,
    expiresAt: res.expiresAt ?? res.expires_at ?? 0,
    user: res.user,
  };
}

export type RefreshResponse = LoginResponse;
