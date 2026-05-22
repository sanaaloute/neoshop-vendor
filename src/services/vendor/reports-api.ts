import { vendorApiClient } from "@/services/api/client";

/** POST /reports */
export async function submitReport(body: {
  reportedUserId?: string;
  reportedVendorId?: string;
  category:
    | "harassment"
    | "fraud"
    | "spam"
    | "inappropriate_content"
    | "order_issue"
    | "other";
  details: string;
}) {
  const { data } = await vendorApiClient.post("/api/v1/reports", body);
  return data;
}

/** GET /reports/me */
export async function listMyReports() {
  const { data } = await vendorApiClient.get("/api/v1/reports/me");
  return data;
}
