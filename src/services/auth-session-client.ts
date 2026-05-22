import type { VendorUser } from "@/types/auth";

const CSRF_HEADER = "X-CSRF-Token";

/** Fetches a CSRF secret for mutating same-origin cookie routes (double-submit cookie). */
export async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/api/auth/csrf", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("csrf_failed");
  }
  const data = (await res.json()) as { csrfToken?: string };
  if (!data.csrfToken) {
    throw new Error("csrf_failed");
  }
  return data.csrfToken;
}

export async function syncHttpOnlySession(tokens: {
  accessToken: string;
  refreshToken: string;
  sessionId?: string;
}) {
  const csrf = await fetchCsrfToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [CSRF_HEADER]: csrf,
    },
    body: JSON.stringify(tokens),
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("session_sync_failed");
  }
}

export async function clearHttpOnlySession() {
  const csrf = await fetchCsrfToken();
  const res = await fetch("/api/auth/session", {
    method: "DELETE",
    credentials: "include",
    headers: { [CSRF_HEADER]: csrf },
  });
  if (!res.ok) {
    throw new Error("session_clear_failed");
  }
}

export async function refreshSessionRequest() {
  const csrf = await fetchCsrfToken();
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { [CSRF_HEADER]: csrf },
  });
  if (!res.ok) {
    throw new Error("refresh_failed");
  }
  return (await res.json()) as {
    accessToken: string;
    refreshToken?: string;
  };
}

export async function fetchSessionUser(): Promise<VendorUser | null> {
  const res = await fetch("/api/auth/me", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { user: VendorUser };
  return data.user;
}

export async function fetchAccessTokenFromCookie(): Promise<string | null> {
  const res = await fetch("/api/auth/token", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { accessToken: string };
  return data.accessToken;
}
