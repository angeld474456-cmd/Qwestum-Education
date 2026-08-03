import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const firstTaskId = "22222222-2222-4222-8222-222222222222";
const secondTaskId = "33333333-3333-4333-8333-333333333333";
const taskIds = [secondTaskId, firstTaskId];
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { reorderOwnedQuestTasks } from "@/services/teacher-task-ordering.server";

function configure(data: unknown, error: unknown = null, user: unknown = { id: "owner" }) {
  mocks.auth.mockResolvedValue({ data: { user } });
  mocks.rpc.mockResolvedValue({ data, error });
  mocks.createClient.mockResolvedValue({
    auth: { getUser: mocks.auth },
    rpc: mocks.rpc,
  });
}

describe("reorderOwnedQuestTasks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls the owner-safe reorder RPC once with the full ordered task list", async () => {
    configure(taskIds.map((task_id, index) => ({ task_id, sort_order: index + 1 })));

    await expect(reorderOwnedQuestTasks(questId, taskIds)).resolves.toEqual({
      status: "ok",
      taskIds,
    });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("reorder_owned_quest_tasks", {
      p_quest_id: questId,
      p_task_ids: taskIds,
    });
  });

  it("returns unauthorized without calling the RPC", async () => {
    configure(null, null, null);

    await expect(reorderOwnedQuestTasks(questId, taskIds)).resolves.toEqual({
      status: "unauthorized",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("maps a missing, stale, or foreign task set to owner-safe not_found", async () => {
    configure([{ task_id: firstTaskId, sort_order: 1 }]);

    await expect(reorderOwnedQuestTasks(questId, taskIds)).resolves.toEqual({
      status: "not_found",
    });
  });

  it("maps RPC errors and malformed successful data to safe errors", async () => {
    configure(null, { message: "RAW_DATABASE_ERROR" });
    await expect(reorderOwnedQuestTasks(questId, taskIds)).resolves.toEqual({
      status: "error",
    });

    configure([
      { task_id: secondTaskId, sort_order: 2 },
      { task_id: firstTaskId, sort_order: 1 },
    ]);
    await expect(reorderOwnedQuestTasks(questId, taskIds)).resolves.toEqual({
      status: "error",
    });

    configure(null);
    mocks.rpc.mockRejectedValue(new Error("RAW_DATABASE_THROW"));
    const result = await reorderOwnedQuestTasks(questId, taskIds);
    expect(result).toEqual({ status: "error" });
    expect(JSON.stringify(result)).not.toMatch(/RAW_DATABASE/);
  });

  it("rejects malformed input before creating a Supabase client", async () => {
    await expect(
      reorderOwnedQuestTasks(questId, [firstTaskId, firstTaskId])
    ).resolves.toEqual({ status: "not_found" });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
