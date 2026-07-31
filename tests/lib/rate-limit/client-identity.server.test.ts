import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getTrustedClientIdentity } from "@/lib/rate-limit/client-identity.server";

function requestWithIdentity(value?: string) {
  const headers = new Headers();

  if (value !== undefined) {
    headers.set("x-forwarded-for", value);
  }

  return new Request("https://app.example/api/public/quests/id/submit", {
    headers,
  });
}

describe("trusted Vercel client identity", () => {
  it("accepts and canonicalizes IPv4 values", () => {
    expect(getTrustedClientIdentity(requestWithIdentity("203.0.113.7"))).toBe(
      "203.0.113.7"
    );
    expect(getTrustedClientIdentity(requestWithIdentity(" 203.0.113.7 "))).toBe(
      "203.0.113.7"
    );
  });

  it("canonicalizes IPv6 and IPv4-mapped IPv6 values", () => {
    expect(
      getTrustedClientIdentity(
        requestWithIdentity("2001:0db8:0000:0000:0000:0000:0000:0001")
      )
    ).toBe("2001:db8::1");
    expect(getTrustedClientIdentity(requestWithIdentity("2001:db8::1"))).toBe(
      "2001:db8::1"
    );
    expect(getTrustedClientIdentity(requestWithIdentity("::ffff:192.0.2.1"))).toBe(
      "192.0.2.1"
    );
  });

  it("rejects absent, multi-value, zone-qualified, malformed, and untrusted headers", () => {
    expect(getTrustedClientIdentity(requestWithIdentity())).toBeNull();
    expect(
      getTrustedClientIdentity(requestWithIdentity("203.0.113.7, 198.51.100.2"))
    ).toBeNull();
    expect(getTrustedClientIdentity(requestWithIdentity("fe80::1%eth0"))).toBeNull();
    expect(getTrustedClientIdentity(requestWithIdentity("not-an-ip"))).toBeNull();

    const vercelForwardedOnly = new Request(
      "https://app.example/api/public/quests/id/submit",
      { headers: { "x-vercel-forwarded-for": "203.0.113.7" } }
    );
    expect(getTrustedClientIdentity(vercelForwardedOnly)).toBeNull();

    const realIpOnly = new Request(
      "https://app.example/api/public/quests/id/submit",
      { headers: { "x-real-ip": "203.0.113.7" } }
    );
    expect(getTrustedClientIdentity(realIpOnly)).toBeNull();
  });
});
