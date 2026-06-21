import axios from "axios";

type FieldError = {
  property: string;
  messages?: string[];
};

type ApiErrorData = {
  message?: string | string[];
  code?: string;
  details?: {
    fields?: FieldError[];
  };
};

/**
 * Turns request failures into short copy suitable for vendors (not env var names or stack traces).
 * Prefer structured per-field messages from `details.fields` when available, as documented
 * in the vendor API and chat translation guides.
 */
export function httpErrorMessageForUser(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as ApiErrorData | undefined;

    // Per-field validation messages take precedence over generic top-level messages.
    const fields = data?.details?.fields;
    if (fields && fields.length > 0) {
      const messages = fields
        .flatMap((f) => f.messages ?? [])
        .filter((m): m is string => typeof m === "string" && m.trim().length > 0);
      if (messages.length > 0) {
        return messages.join("\n");
      }
    }

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

/**
 * Returns the machine-readable error code if the backend provided one.
 * Useful for branching logic on known codes like INSUFFICIENT_BALANCE.
 */
export function httpErrorCode(e: unknown): string | undefined {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as ApiErrorData | undefined;
    return data?.code;
  }
  return undefined;
}
