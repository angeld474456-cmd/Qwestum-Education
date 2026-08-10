import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const taskId = "22222222-2222-4222-8222-222222222222";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { deleteOwnedQuestTask } from "@/services/teacher-task-deletion.server";

function deletedTask(overrides: Record<string, unknown> = {}) {
  return {
    outcome: "deleted",
    id: taskId,
    image_url: null,
    ...overrides,
  };
}

function configure(
  data: unknown,
  error: unknown = null,
  user: unknown = { id: "owner" }
) {
  mocks.auth.mockResolvedValue({ data: { user } });
  mocks.rpc.mockResolvedValue({ data, error });
  mocks.createClient.mockResolvedValue({
    auth: { getUser: mocks.auth },
    rpc: mocks.rpc,
  });
}

describe("deleteOwnedQuestTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls the owner-safe delete RPC once with exact arguments", async () => {
    configure([deletedTask({ image_url: "https://example.test/image.png" })]);

    await expect(deleteOwnedQuestTask(questId, taskId)).resolves.toEqual({
      status: "deleted",
      id: taskId,
      imageUrl: "https://example.test/image.png",
      userId: "owner",
    });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("delete_owned_quest_task", {
      p_quest_id: questId,
      p_task_id: taskId,
    });
  });

  it("returns unauthorized without calling the RPC", async () => {
    configure(null, null, null);

    await expect(deleteOwnedQuestTask(questId, taskId)).resolves.toEqual({
      status: "unauthorized",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("maps zero rows to owner-safe not_found", async () => {
    configure([]);

    await expect(deleteOwnedQuestTask(questId, taskId)).resolves.toEqual({
      status: "not_found",
    });
  });

  it("maps the exact public-final-task outcome", async () => {
    configure([{ outcome: "last_public_task", id: null, image_url: null }]);

    await expect(deleteOwnedQuestTask(questId, taskId)).resolves.toEqual({
      status: "last_public_task",
    });
  });

  it("accepts deleted outcomes with null or string image URLs", async () => {
    configure([deletedTask()]);
    await expect(deleteOwnedQuestTask(questId, taskId)).resolves.toEqual({
      status: "deleted",
      id: taskId,
      imageUrl: null,
      userId: "owner",
    });

    configure([deletedTask({ image_url: "https://example.test/image.png" })]);
    await expect(deleteOwnedQuestTask(questId, taskId)).resolves.toEqual({
      status: "deleted",
      id: taskId,
      imageUrl: "https://example.test/image.png",
      userId: "owner",
    });
  });

  it("maps provider errors and throws to safe errors", async () => {
    configure(null, { message: "RAW_DATABASE_ERROR" });
    await expect(deleteOwnedQuestTask(questId, taskId)).resolves.toEqual({
      status: "error",
    });

    configure(null);
    mocks.rpc.mockRejectedValue(new Error("RAW_DATABASE_THROW"));
    await expect(deleteOwnedQuestTask(questId, taskId)).resolves.toEqual({
      status: "error",
    });
  });

  it("rejects unknown, malformed, inconsistent, and multiple RPC rows", async () => {
    const invalidRows = [
      { outcome: "unknown", id: null, image_url: null },
      { outcome: "deleted", id: "not-a-uuid", image_url: null },
      { outcome: "deleted", id: taskId, image_url: 1 },
      { outcome: "last_public_task", id: taskId, image_url: null },
      { outcome: "deleted", id: taskId, image_url: null, extra: true },
    ];

    for (const row of invalidRows) {
      configure([row]);
      await expect(deleteOwnedQuestTask(questId, taskId)).resolves.toEqual({
        status: "error",
      });
    }

    configure([deletedTask(), deletedTask()]);
    await expect(deleteOwnedQuestTask(questId, taskId)).resolves.toEqual({
      status: "error",
    });
  });
});
