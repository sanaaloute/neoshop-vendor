import { vendorApiClient } from "@/services/api/client";

import type {
  DisputeDetail,
  DisputeMessage,
  DisputeSummary,
  Paginated,
  PostDisputeMessageDto,
} from "./types";

/** GET /vendors/me/disputes — list disputes for orders placed with this vendor */
export async function listVendorDisputes(params?: { skip?: number; take?: number }) {
  const { data } = await vendorApiClient.get<Paginated<DisputeSummary>>(
    "/api/v1/vendors/me/disputes",
    { params }
  );
  return data;
}

/** GET /vendors/me/disputes/:disputeId — get dispute detail (vendor view) */
export async function getVendorDispute(disputeId: string) {
  const { data } = await vendorApiClient.get<DisputeDetail>(`/api/v1/vendors/me/disputes/${disputeId}`);
  return data;
}

/** POST /vendors/me/disputes/:disputeId/messages — post a message in a dispute */
export async function postDisputeMessage(disputeId: string, body: PostDisputeMessageDto) {
  const { data } = await vendorApiClient.post<DisputeMessage>(
    `/api/v1/vendors/me/disputes/${disputeId}/messages`,
    body
  );
  return data;
}
