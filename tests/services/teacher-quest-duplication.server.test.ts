import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const duplicateId = "22222222-2222-4222-8222-222222222222";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { duplicateOwnedQuest } from "@/services/teacher-quest-duplication.server";

function configure(data: unknown, error: unknown = null, user: unknown = { id: "owner" }) {
  mocks.auth.mockResolvedValue({ data: { user } });
  mocks.rpc.mockResolvedValue({ data, error });
  mocks.createClient.mockResolvedValue({
    auth: { getUser: mocks.auth },
    rpc: mocks.rpc,
  });
}

describe("duplicateOwnedQuest", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls the owner-safe duplication RPC with only source_quest_id", async () => {
    configure(duplicateId);

    await expect(duplicateOwnedQuest(questId)).resolves.toEqual({
      status: "ok",
      id: duplicateId,
    });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("duplicate_owned_quest", {
      source_quest_id: questId,
    });
  });

  it("returns unauthorized without calling the RPC", async () => {
    configure(null, null, null);

    await expect(duplicateOwnedQuest(questId)).resolves.toEqual({
      status: "unauthorized",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("treats a null RPC result as owner-safe not_found", async () => {
    configure(null);

    await expect(duplicateOwnedQuest(questId)).resolves.toEqual({
      status: "not_found",
    });
  });

  it("maps RPC failures to a safe error without raw detail", async () => {
    configure(null, {
      message: "RAW_DATABASE_MESSAGE_DO_NOT_EXPOSE",
      details: "RAW_DATABASE_DETAIL_DO_NOT_EXPOSE",
    });

    const result = await duplicateOwnedQuest(questId);
    expect(result).toEqual({ status: "error" });
    expect(JSON.stringify(result)).not.toMatch(/RAW_DATABASE_MESSAGE|RAW_DATABASE_DETAIL/);
  });

  it("maps an unexpected RPC throw to a safe error", async () => {
    configure(null);
    mocks.rpc.mockRejectedValue(new Error("RAW_DATABASE_THROW_DO_NOT_EXPOSE"));

    const result = await duplicateOwnedQuest(questId);
    expect(result).toEqual({ status: "error" });
    expect(JSON.stringify(result)).not.toContain("RAW_DATABASE_THROW_DO_NOT_EXPOSE");
  });

  it("rejects malformed input and malformed RPC success values", async () => {
    await expect(duplicateOwnedQuest("not-a-uuid")).resolves.toEqual({
      status: "not_found",
    });
    expect(mocks.createClient).not.toHaveBeenCalled();

    configure("not-a-uuid");
    await expect(duplicateOwnedQuest(questId)).resolves.toEqual({
      status: "error",
    });
  });
});
