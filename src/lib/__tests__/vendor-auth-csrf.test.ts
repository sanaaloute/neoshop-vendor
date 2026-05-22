import { describe, expect, it } from "vitest";

import {
  generateCsrfSecret,
  isValidCsrfTokenShape,
  isValidVendorCsrfRequest,
} from "@/lib/vendor-auth-csrf";

describe("vendor-auth-csrf", () => {
  it("accepts base64url secrets from generateCsrfSecret", () => {
    const s = generateCsrfSecret();
    expect(isValidCsrfTokenShape(s)).toBe(true);
  });

  it("rejects empty, short, or weird tokens", () => {
    expect(isValidCsrfTokenShape("")).toBe(false);
    expect(isValidCsrfTokenShape("x".repeat(31))).toBe(false);
    expect(isValidCsrfTokenShape("ab cd".repeat(20))).toBe(false);
  });

  it("matches header to cookie with timing-safe path", () => {
    const token = generateCsrfSecret();
    const req = new Request("http://localhost/api/x", {
      headers: { "X-CSRF-Token": token },
    });
    expect(isValidVendorCsrfRequest(req, token)).toBe(true);
    expect(isValidVendorCsrfRequest(req, `${token}x`)).toBe(false);
  });
});
