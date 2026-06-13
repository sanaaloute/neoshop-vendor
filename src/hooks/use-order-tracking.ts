"use client";

import { useCallback, useState } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import { getOrderTracking } from "@/services/vendor/orders-api";
import type { TrackingEvent } from "@/services/vendor/types";

/** Fetch tracking events for a specific order on demand. */
export function useOrderTracking() {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = useCallback(async (orderId: string) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderTracking(orderId);
      setEvents(data.events ?? []);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load tracking events."));
    } finally {
      setLoading(false);
    }
  }, []);

  return { events, loading, error, fetchTracking };
}
