"use client";

import { useCallback, useEffect, useState } from "react";

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

export function useRateLimit(
  endpoint: string,
  limit: number,
  windowMs: number
) {
  // Start at 0 to avoid SSR/hydration mismatch; sync with localStorage on mount.
  const [remainingMs, setRemainingMs] = useState(0);

  const refresh = useCallback(() => {
    setRemainingMs(getRemainingCooldown(endpoint, limit, windowMs));
  }, [endpoint, limit, windowMs]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (remainingMs <= 0) return;
    const id = setInterval(() => {
      const next = getRemainingCooldown(endpoint, limit, windowMs);
      setRemainingMs(next);
      if (next <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [endpoint, limit, windowMs, remainingMs]);

  const canRequest = remainingMs <= 0;

  const tryRecord = useCallback(() => {
    if (!canMakeRequest(endpoint, limit, windowMs)) {
      refresh();
      return false;
    }
    recordRequest(endpoint);
    refresh();
    return true;
  }, [endpoint, limit, windowMs, refresh]);

  return {
    canRequest,
    remainingMs,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    tryRecord,
    refresh,
  };
}
