import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const ownerId = "22222222-2222-4222-8222-222222222222";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), createClient: vi.fn(), rpc: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { createOwnedQuest } from "@/services/teacher-quest-creation.server";

const input = { title: "New quest", description: "Description", difficulty: 2 };

function configure(data: unknown, error: unknown = null, user: unknown = { id: ownerId }) {
  mocks.auth.mockResolvedValue({ data: { user } });
  mocks.rpc.mockResolvedValue({ data, error });
  mocks.createClient.mockResolvedValue({ auth: { getUser: mocks.auth }, rpc: mocks.rpc });
}

describe("createOwnedQuest", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls the creation RPC exactly once with only the approved arguments", async () => {
    configure([{ outcome: "created", id: questId }]);

    await expect(createOwnedQuest(input)).resolves.toEqual({ status: "ok", id: questId });
    expect(mocks.rpc).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenCalledWith("create_owned_quest", {
      p_title: input.title,
      p_description: input.description,
      p_difficulty: input.difficulty,
    });
  });

  it("maps unauthenticated callers without calling the RPC", async () => {
    configure(null, null, null);

    await expect(createOwnedQuest(input)).resolves.toEqual({ status: "unauthorized" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("accepts only exact valid created and invalid outcomes", async () => {
    configure([{ outcome: "invalid", id: null }]);
    await expect(createOwnedQuest(input)).resolves.toEqual({ status: "invalid" });

    configure([{ outcome: "created", id: questId }]);
    await expect(createOwnedQuest(input)).resolves.toEqual({ status: "ok", id: questId });
  });

  it.each([
    [[], null],
    [null, null],
    [[{ outcome: "created", id: questId }, { outcome: "created", id: questId }], null],
    [[{ outcome: "unknown", id: null }], null],
    [[{ outcome: "created", id: null }], null],
    [[{ outcome: "created", id: "not-a-uuid" }], null],
    [[{ outcome: "invalid", id: questId }], null],
    [[{ outcome: "created", id: questId, extra: true }], null],
    [[{ outcome: "created" }], null],
    [[{ outcome: "created", id: questId }], { message: "RAW_PROVIDER_ERROR" }],
  ])("fails closed for malformed or provider results", async (data, error) => {
    configure(data, error);
    await expect(createOwnedQuest(input)).resolves.toEqual({ status: "error" });
  });

  it("fails closed when the RPC throws", async () => {
    mocks.auth.mockResolvedValue({ data: { user: { id: ownerId } } });
    mocks.rpc.mockRejectedValue(new Error("RPC threw"));
    mocks.createClient.mockResolvedValue({ auth: { getUser: mocks.auth }, rpc: mocks.rpc });

    await expect(createOwnedQuest(input)).resolves.toEqual({ status: "error" });
  });
});
