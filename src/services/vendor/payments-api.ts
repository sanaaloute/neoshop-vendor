import { vendorApiClient } from "@/services/api/client";

import type { CapturePaymentDto, PaymentMethod } from "./types";

/** GET /payments/methods — list available payment methods */
export async function listPaymentMethods() {
  const { data } = await vendorApiClient.get<PaymentMethod[]>("/api/v1/payments/methods");
  return data;
}

/** POST /payments/orders/:orderId/capture — record a manual/offline payment capture */
export async function captureOrderPayment(orderId: string, body: CapturePaymentDto) {
  const { data } = await vendorApiClient.post(`/api/v1/payments/orders/${orderId}/capture`, body);
  return data;
}
