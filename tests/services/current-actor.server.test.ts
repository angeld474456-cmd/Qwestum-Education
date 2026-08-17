import { beforeEach, describe, expect, it, vi } from "vitest";

const userId = "11111111-1111-4111-8111-111111111111";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createClient: vi.fn(),
  eq: vi.fn(),
  from: vi.fn(),
  maybeSingle: vi.fn(),
  select: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { getCurrentActor } from "@/services/current-actor.server";

function configure(user: unknown, profile: unknown, error: unknown = null) {
  mocks.auth.mockResolvedValue({ data: { user } });
  mocks.maybeSingle.mockResolvedValue({ data: profile, error });
  mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.from.mockReturnValue({ select: mocks.select });
  mocks.createClient.mockResolvedValue({
    auth: { getUser: mocks.auth },
    from: mocks.from,
  });
}

describe("getCurrentActor", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["teacher", "student"] as const)("returns a valid %s actor", async (role) => {
    configure({ id: userId, email: "user@example.test" }, { id: userId, role });

    await expect(getCurrentActor()).resolves.toEqual({
      id: userId,
      email: "user@example.test",
      role,
    });
    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(mocks.select).toHaveBeenCalledWith("id, role");
    expect(mocks.eq).toHaveBeenCalledWith("id", userId);
  });

  it("returns null without an authenticated user", async () => {
    configure(null, null);

    await expect(getCurrentActor()).resolves.toBeNull();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it.each([
    [null, null],
    [{ id: userId, role: "admin" }, null],
    [{ id: "different-id", role: "teacher" }, null],
    [{ id: userId, role: "teacher" }, { message: "provider failure" }],
  ])("fails closed for missing, malformed, or unreadable profiles", async (profile, error) => {
    configure({ id: userId, email: "user@example.test" }, profile, error);

    await expect(getCurrentActor()).resolves.toBeNull();
  });
});
