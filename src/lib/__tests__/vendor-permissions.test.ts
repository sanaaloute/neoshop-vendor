import { describe, expect, it } from "vitest";

import {
  getRequiredPermissionForPathname,
  normalizeVendorTeamRole,
  ROLE_PERMISSIONS,
} from "@/lib/vendor-permissions";

describe("vendor-permissions", () => {
  it("maps path prefixes to capabilities", () => {
    expect(getRequiredPermissionForPathname("/products")).toBe("products");
    expect(getRequiredPermissionForPathname("/inventory/foo")).toBe("products");
    expect(getRequiredPermissionForPathname("/orders")).toBe("orders");
    expect(getRequiredPermissionForPathname("/disputes")).toBe("orders");
    expect(getRequiredPermissionForPathname("/payouts")).toBe("payouts");
    expect(getRequiredPermissionForPathname("/analytics")).toBe("analytics");
    expect(getRequiredPermissionForPathname("/chat")).toBe("chat");
    expect(getRequiredPermissionForPathname("/dashboard")).toBeNull();
  });

  it("normalizes role tokens", () => {
    expect(normalizeVendorTeamRole("OWNER")).toBe("owner");
    expect(normalizeVendorTeamRole("staff")).toBe("staff");
    expect(normalizeVendorTeamRole(undefined)).toBe("owner");
  });

  it("staff role excludes payouts and analytics by default", () => {
    expect(ROLE_PERMISSIONS.staff).not.toContain("payouts");
    expect(ROLE_PERMISSIONS.staff).not.toContain("analytics");
  });
});
