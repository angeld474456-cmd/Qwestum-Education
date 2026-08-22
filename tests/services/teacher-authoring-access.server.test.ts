import { beforeEach, describe, expect, it, vi } from "vitest";

const userId = "11111111-1111-4111-8111-111111111111";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  eq: vi.fn(),
  from: vi.fn(),
  getCurrentActor: vi.fn(),
  maybeSingle: vi.fn(),
  select: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/services/current-actor.server", () => ({
  getCurrentActor: mocks.getCurrentActor,
}));

import { getTeacherAuthoringAccess } from "@/services/teacher-authoring-access.server";

function configureEntitlement(data: unknown, error: unknown = null) {
  mocks.maybeSingle.mockResolvedValue({ data, error });
  mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.from.mockReturnValue({ select: mocks.select });
  mocks.createClient.mockResolvedValue({ from: mocks.from });
}

function teacher() {
  return {
    status: "authenticated" as const,
    actor: { id: userId, role: "teacher" as const, email: "teacher@example.test" },
  };
}

describe("getTeacherAuthoringAccess", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["unauthenticated", { status: "unauthenticated" }],
    ["profile unavailable", { status: "profile_unavailable" }],
  ])("returns %s without reading entitlements", async (_label, result) => {
    mocks.getCurrentActor.mockResolvedValue(result);

    await expect(getTeacherAuthoringAccess()).resolves.toEqual(result);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("denies a student even with an active entitlement", async () => {
    mocks.getCurrentActor.mockResolvedValue({
      status: "authenticated",
      actor: { id: userId, role: "student", email: "student@example.test" },
    });

    await expect(getTeacherAuthoringAccess()).resolves.toEqual({ status: "not_teacher" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it.each([
    ["no entitlement", null],
    ["past due", { status: "past_due", access_expires_at: null }],
    ["canceled", { status: "canceled", access_expires_at: null }],
    ["expired", { status: "expired", access_expires_at: null }],
    ["active with expired timestamp", { status: "active", access_expires_at: "2020-01-01T00:00:00.000Z" }],
    ["trialing with expired timestamp", { status: "trialing", access_expires_at: "2020-01-01T00:00:00.000Z" }],
    ["unexpected status", { status: "granted", access_expires_at: null }],
    ["invalid timestamp", { status: "active", access_expires_at: "not-a-timestamp" }],
    ["malformed timestamp", { status: "active", access_expires_at: 123 }],
    ["malformed status", { status: null, access_expires_at: null }],
  ])("fails closed for %s", async (_label, entitlement) => {
    mocks.getCurrentActor.mockResolvedValue(teacher());
    configureEntitlement(entitlement);

    await expect(getTeacherAuthoringAccess()).resolves.toEqual({
      status: "entitlement_inactive",
    });
  });

  it.each([
    ["active with no expiry", { status: "active", access_expires_at: null }],
    ["active with a future expiry", { status: "active", access_expires_at: "2099-01-01T00:00:00.000Z" }],
    ["trialing with no expiry", { status: "trialing", access_expires_at: null }],
    ["trialing with a future expiry", { status: "trialing", access_expires_at: "2099-01-01T00:00:00.000Z" }],
  ])("allows a teacher with a %s active entitlement", async (_label, entitlement) => {
    mocks.getCurrentActor.mockResolvedValue(teacher());
    configureEntitlement(entitlement);

    await expect(getTeacherAuthoringAccess()).resolves.toEqual({
      status: "allowed",
      userId,
    });
    expect(mocks.from).toHaveBeenCalledWith("teacher_entitlements");
    expect(mocks.select).toHaveBeenCalledWith("status, access_expires_at");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", userId);
  });

  it("treats the expiry boundary as inactive", async () => {
    mocks.getCurrentActor.mockResolvedValue(teacher());
    configureEntitlement({
      status: "active",
      access_expires_at: new Date().toISOString(),
    });

    await expect(getTeacherAuthoringAccess()).resolves.toEqual({
      status: "entitlement_inactive",
    });
  });
});
