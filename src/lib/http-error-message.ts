import axios from "axios";

/**
 * Turns request failures into short copy suitable for vendors (not env var names or stack traces).
 */
export function httpErrorMessageForUser(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { message?: string | string[] } | undefined;
    const m = data?.message;
    if (typeof m === "string" && m.trim()) return m;
    if (Array.isArray(m) && m.length) return m.join(", ");
    const status = e.response?.status;
    if (status === 401 || status === 403) {
      return "You're signed out or not allowed to do this. Sign in again or contact support.";
    }
    if (status === 404) {
      return "We couldn't find that. Refresh the page and try again.";
    }
    if (status === 409) {
      return "This already exists. If you already have an account, try signing in.";
    }
    if (status === 422) {
      return "The information you provided isn't valid. Check and try again.";
    }
    if (status === 429) {
      return "Too many requests — slow down and retry.";
    }
    if (status === 408 || e.code === "ECONNABORTED") {
      return "The request took too long. Check your connection and try again.";
    }
    if (status && status >= 500) {
      return "Something went wrong on the server. Please try again shortly.";
    }
    if (!e.response && e.request) {
      return "Could not reach your marketplace. Check your connection and try again.";
    }
    return fallback;
  }
  if (e instanceof Error) {
    const msg = e.message;
    if (/NEXT_PUBLIC_|ECONNREFUSED|Network Error/i.test(msg)) {
      return "Marketplace connection is not available. Try again later or contact support.";
    }
    if (msg.trim()) return msg;
  }
  return fallback;
}
