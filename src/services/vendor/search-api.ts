import { vendorApiClient } from "@/services/api/client";

import type { SearchHistoryItem, SearchSuggestion } from "./types";

/** GET /search/suggestions — autocomplete search suggestions */
export async function getSearchSuggestions(params: { q: string }) {
  const { data } = await vendorApiClient.get<SearchSuggestion[]>("/api/v1/search/suggestions", {
    params,
  });
  return data;
}

/** GET /search/trending — trending search queries */
export async function getTrendingSearches() {
  const { data } = await vendorApiClient.get<SearchSuggestion[]>("/api/v1/search/trending");
  return data;
}

/** GET /search/history — current user's search history */
export async function getSearchHistory() {
  const { data } = await vendorApiClient.get<SearchHistoryItem[]>("/api/v1/search/history");
  return data;
}

/** POST /search/history — record a search query in history */
export async function addSearchHistory(body: { query: string }) {
  const { data } = await vendorApiClient.post<SearchHistoryItem>("/api/v1/search/history", body);
  return data;
}

/** DELETE /search/history — clear search history */
export async function clearSearchHistory() {
  await vendorApiClient.delete("/api/v1/search/history");
}
