"use client";

import { useCallback } from "react";

/**
 * ⚠️ CLIENT-SIDE ONLY — NOT A SECURITY BOUNDARY
 *
 * This module is a UX helper: it records recent request timestamps in
 * localStorage so the UI can show cooldown timers and reduce accidental
 * double-clicks. It must NOT be relied on to stop abuse because:
 *
 * - localStorage can be cleared, edited, or disabled by the user.
 * - It is per-browser/profile and does not survive incognito windows.
 * - A malicious client can call the API directly without using this UI.
 *
 * The upstream gateway is the authoritative rate limiter. The frontend
 * should always send the request and surface the server's 429 response.
 */

const STORAGE_KEY = "neoshop-vendor-rate-limits";

function getKey(endpoint: string): string {
  return `${STORAGE_KEY}:${endpoint}`;
}

function readTimestamps(endpoint: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getKey(endpoint));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as number[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTimestamps(endpoint: string, timestamps: number[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getKey(endpoint), JSON.stringify(timestamps));
  } catch {
    // storage full or disabled
  }
}

function nowMs(): number {
  return Date.now();
}

function prune(timestamps: number[], windowMs: number): number[] {
  const cutoff = nowMs() - windowMs;
  return timestamps.filter((t) => t > cutoff);
}

/**
 * Check whether a request can be made to the given endpoint without
 * exceeding the rate limit.
 */
export function canMakeRequest(
  endpoint: string,
  limit: number,
  windowMs: number
): boolean {
  const timestamps = prune(readTimestamps(endpoint), windowMs);
  writeTimestamps(endpoint, timestamps);
  return timestamps.length < limit;
}

/**
 * Record a request attempt for the given endpoint.
 */
export function recordRequest(endpoint: string) {
  const timestamps = readTimestamps(endpoint);
  timestamps.push(nowMs());
  writeTimestamps(endpoint, timestamps);
}

/**
 * Return the remaining cooldown in milliseconds before the next request
 * is allowed. Returns 0 if a request can be made immediately.
 */
export function getRemainingCooldown(
  endpoint: string,
  limit: number,
  windowMs: number
): number {
  const timestamps = prune(readTimestamps(endpoint), windowMs);
  writeTimestamps(endpoint, timestamps);
  if (timestamps.length < limit) return 0;
  const oldest = Math.min(...timestamps);
  const remaining = oldest + windowMs - nowMs();
  return Math.max(0, remaining);
}

// ── React hook ──

/**
 * React wrapper around the client-side rate-limit tracker.
 *
 * IMPORTANT: The returned helpers always allow the caller to proceed. They
 * exist only to record request timestamps for UX/debugging and to keep the
 * existing component signatures working. The upstream gateway is the only
 * authoritative rate limiter; the UI must send the request and handle 429.
 */
export function useRateLimit(
  endpoint: string,
  _limit: number,
  _windowMs: number
) {
  // Parameters kept for API compatibility with existing callers.
  void _limit;
  void _windowMs;

  const tryRecord = useCallback(() => {
    recordRequest(endpoint);
    return true;
  }, [endpoint]);

  return {
    canRequest: true,
    remainingSeconds: 0,
    tryRecord,
  };
}
