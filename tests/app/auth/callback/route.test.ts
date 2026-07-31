import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { GET } from "@/app/auth/callback/route";

const origin = "https://app.example";

function createCallbackRequest(next: string | undefined, code = "auth-code") {
  const url = new URL("/auth/callback", origin);

  url.searchParams.set("code", code);

  if (next !== undefined) {
    url.searchParams.set("next", next);
  }

  return new Request(url);
}

function mockSuccessfulExchange() {
  mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
  mocks.createClient.mockResolvedValue({
    auth: { exchangeCodeForSession: mocks.exchangeCodeForSession },
  });
}

async function expectSuccessfulRedirect(next: string | undefined) {
  mockSuccessfulExchange();

  const response = await GET(createCallbackRequest(next));

  expect(response.status).toBe(307);
  expect(mocks.createClient).toHaveBeenCalledTimes(1);
  expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("auth-code");

  return response.headers.get("location");
}

describe("auth callback redirects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["/dashboard", "https://app.example/dashboard"],
    ["/dashboard/quests", "https://app.example/dashboard/quests"],
    [
      "/dashboard/quests?tab=public",
      "https://app.example/dashboard/quests?tab=public",
    ],
    [
      "/dashboard/quests/123e4567-e89b-12d3-a456-426614174000/settings",
      "https://app.example/dashboard/quests/123e4567-e89b-12d3-a456-426614174000/settings",
    ],
    ["/dashboard#account", "https://app.example/dashboard#account"],
  ])("preserves the safe local destination %s", async (next, expected) => {
    await expect(expectSuccessfulRedirect(next)).resolves.toBe(expected);
  });

  it.each([
    ["missing destination", undefined],
    ["empty destination", ""],
    ["HTTPS absolute URL", "https://evil.example"],
    ["HTTP absolute URL", "http://evil.example"],
    ["protocol-relative URL", "//evil.example"],
    ["raw backslash URL", "\\evil.example"],
    ["single-slash backslash URL", "/\\evil.example"],
    ["encoded backslash URL", "/%5Cevil.example"],
    ["double-encoded backslash URL", "/%255Cevil.example"],
    ["encoded protocol-relative URL", "/%2F%2Fevil.example"],
    ["double-encoded protocol-relative URL", "/%252F%252Fevil.example"],
    ["malformed percent encoding", "/dashboard%"],
    ["control-character URL", "\u0000/dashboard"],
    ["whitespace-prefixed external URL", " https://evil.example"],
    ["userinfo hostname trick", "//app.example@evil.example/dashboard"],
    [
      "absolute userinfo hostname trick",
      "https://app.example@evil.example/dashboard",
    ],
  ])("falls back for %s", async (_label, next) => {
    const location = await expectSuccessfulRedirect(next);

    expect(location).toBe("https://app.example/dashboard");
    expect(new URL(location!).origin).toBe(origin);
  });

  it("preserves the missing-code response without creating a Supabase client", async () => {
    const response = await GET(
      new Request("https://app.example/auth/callback?next=/dashboard")
    );

    expect(response.headers.get("location")).toBe(
      "https://app.example/login?error=missing_auth_code"
    );
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("preserves the safe exchange-failure response", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: new Error("failed") });
    mocks.createClient.mockResolvedValue({
      auth: { exchangeCodeForSession: mocks.exchangeCodeForSession },
    });

    const response = await GET(createCallbackRequest("/dashboard"));

    expect(response.headers.get("location")).toBe(
      "https://app.example/login?error=auth_callback_failed"
    );
  });
});
