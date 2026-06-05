import axios from "axios";

/**
 * Extract the most meaningful error message from an auth failure.
 * Prefers the backend's response body message over Axios's generic
 * "Request failed with status code XXX".
 */
export function getAuthErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { message?: string | string[] } | undefined;
    const m = data?.message;
    if (typeof m === "string" && m.trim()) return m;
    if (Array.isArray(m) && m.length) return m.join(", ");
  }
  if (e instanceof Error) return e.message;
  return "";
}
