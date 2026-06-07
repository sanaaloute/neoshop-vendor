import { vendorApiClient } from "@/services/api/client";

import type {
  ExchangeRateConvertRequest,
  ExchangeRateConvertResponse,
  ExchangeRateCurrentResponse,
} from "./types";

/** GET /exchange-rates/current — get current exchange rate between two currencies */
export async function getCurrentExchangeRate(params: {
  from: string;
  to: string;
}) {
  const { data } = await vendorApiClient.get<ExchangeRateCurrentResponse>(
    "/api/v1/exchange-rates/current",
    { params }
  );
  return data;
}

/** POST /exchange-rates/convert — convert an amount between currencies */
export async function convertExchangeRate(body: ExchangeRateConvertRequest) {
  const { data } = await vendorApiClient.post<ExchangeRateConvertResponse>(
    "/api/v1/exchange-rates/convert",
    body
  );
  return data;
}
