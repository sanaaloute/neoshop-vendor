"use client";

import { useState, useCallback } from "react";

import { getApiBaseUrl } from "@/config/auth";
import { httpErrorMessageForUser } from "@/lib/http-error-message";
import {
  getSearchSuggestions,
  getTrendingSearches,
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
} from "@/services/vendor/search-api";
import type { SearchSuggestion, SearchHistoryItem } from "@/services/vendor/types";

/** Search suggestions, trending queries, and personal search history. */
export function useSearch() {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [trending, setTrending] = useState<SearchSuggestion[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSearchSuggestions({ q });
      setSuggestions(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load suggestions."));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrending = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTrendingSearches();
      setTrending(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load trending searches."));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSearchHistory();
      setHistory(data);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not load search history."));
    } finally {
      setLoading(false);
    }
  }, []);

  const recordQuery = useCallback(async (query: string) => {
    if (!getApiBaseUrl()) return;
    try {
      await addSearchHistory({ query });
    } catch {
      /* ignore silently */
    }
  }, []);

  const clearHistory = useCallback(async () => {
    if (!getApiBaseUrl()) return;
    setLoading(true);
    setError(null);
    try {
      await clearSearchHistory();
      setHistory([]);
    } catch (e) {
      setError(httpErrorMessageForUser(e, "Could not clear history."));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    suggestions,
    trending,
    history,
    loading,
    error,
    fetchSuggestions,
    fetchTrending,
    fetchHistory,
    recordQuery,
    clearHistory,
  };
}
