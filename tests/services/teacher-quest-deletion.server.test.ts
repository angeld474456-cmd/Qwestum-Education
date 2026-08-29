import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const ownerId = "22222222-2222-4222-8222-222222222222";
const taskId = "33333333-3333-4333-8333-333333333333";
const otherTaskId = "44444444-4444-4444-8444-444444444444";
const fileId = "55555555-5555-4555-8555-555555555555";
const laterTaskId = "66666666-6666-4666-8666-666666666666";
const otherOwnerId = "77777777-7777-4777-8777-777777777777";
const otherQuestId = "88888888-8888-4888-8888-888888888888";
const origin = "https://project.example";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getTeacherAuthoringAccess: vi.fn(),
  remove: vi.fn(),
  rpc: vi.fn(),
  storageFrom: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/services/teacher-authoring-access.server", () => ({
  getTeacherAuthoringAccess: mocks.getTeacherAuthoringAccess,
}));

import { deleteOwnedQuest } from "@/services/teacher-quest-deletion.server";

function taskImageUrl(
  id = taskId,
  pathOwnerId = ownerId,
  pathQuestId = questId
) {
  return `${origin}/storage/v1/object/public/quest-images/teachers/${pathOwnerId}/quests/${pathQuestId}/tasks/${id}/${fileId}.png`;
}

function coverPath(pathOwnerId = ownerId, pathQuestId = questId) {
  return `teachers/${pathOwnerId}/quests/${pathQuestId}/cover/${fileId}.png`;
}

function deletedRow() {
  return {
    outcome: "deleted",
    id: questId,
    cover_image_path: null,
    task_image_urls: [],
  };
}

function singleQuery(result: { data: unknown; error?: unknown }) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: result.data,
      error: result.error ?? null,
    }),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  return builder;
}

function listQuery(result: { data: unknown; error?: unknown }) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn().mockResolvedValue({
      data: result.data,
      error: result.error ?? null,
    }),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  return builder;
}

function configure(options?: {
  access?: unknown;
  quest?: unknown;
  questError?: unknown;
  taskImages?: unknown;
  taskImagesError?: unknown;
  rpcData?: unknown;
  rpcError?: unknown;
  removeResult?: { error: unknown };
}) {
  const quest = singleQuery({
    data:
      options?.quest === undefined
        ? { id: questId, cover_image_path: null }
        : options.quest,
    error: options?.questError,
  });
  const taskImages = listQuery({
    data: options?.taskImages === undefined ? [] : options.taskImages,
    error: options?.taskImagesError,
  });

  mocks.getTeacherAuthoringAccess.mockResolvedValue(
    options?.access === undefined
      ? { status: "allowed", userId: ownerId }
      : options.access
  );
  mocks.rpc.mockResolvedValue({
    data: options?.rpcData === undefined ? [deletedRow()] : options.rpcData,
    error: options?.rpcError ?? null,
  });
  mocks.remove.mockResolvedValue(options?.removeResult ?? { error: null });
  mocks.storageFrom.mockReturnValue({ remove: mocks.remove });
  mocks.createClient.mockResolvedValue({
    from: vi.fn((table: string) => (table === "quests" ? quest : taskImages)),
    rpc: mocks.rpc,
    storage: { from: mocks.storageFrom },
  });
}

describe("deleteOwnedQuest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = origin;
  });

  it("cleans trusted cover and task paths before the owner-safe quest delete RPC", async () => {
    configure({
      quest: { id: questId, cover_image_path: coverPath() },
      taskImages: [
        { id: taskId, image_url: taskImageUrl() },
        { id: otherTaskId, image_url: taskImageUrl(otherTaskId) },
      ],
    });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "ok" });

    expect(mocks.remove).toHaveBeenNthCalledWith(1, [coverPath()]);
    expect(mocks.remove).toHaveBeenNthCalledWith(2, [
      `teachers/${ownerId}/quests/${questId}/tasks/${taskId}/${fileId}.png`,
    ]);
    expect(mocks.remove).toHaveBeenNthCalledWith(3, [
      `teachers/${ownerId}/quests/${questId}/tasks/${otherTaskId}/${fileId}.png`,
    ]);
    expect(mocks.remove.mock.invocationCallOrder[2]).toBeLessThan(
      mocks.rpc.mock.invocationCallOrder[0]
    );
    expect(mocks.rpc).toHaveBeenCalledWith("delete_owned_quest", {
      p_quest_id: questId,
    });
  });

  it("stops after a partial cleanup failure and preserves the quest row", async () => {
    configure({
      quest: { id: questId, cover_image_path: coverPath() },
      taskImages: [
        { id: taskId, image_url: taskImageUrl() },
        { id: otherTaskId, image_url: taskImageUrl(otherTaskId) },
        { id: laterTaskId, image_url: taskImageUrl(laterTaskId) },
      ],
    });
    mocks.remove
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "RAW_SECOND_TASK_FAILURE" } });

    // Storage is not transactional with Postgres: the cover and first task
    // are already gone, but the quest must remain when a later cleanup fails.
    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "error" });

    expect(mocks.remove).toHaveBeenCalledTimes(3);
    expect(mocks.remove).toHaveBeenNthCalledWith(1, [coverPath()]);
    expect(mocks.remove).toHaveBeenNthCalledWith(2, [
      `teachers/${ownerId}/quests/${questId}/tasks/${taskId}/${fileId}.png`,
    ]);
    expect(mocks.remove).toHaveBeenNthCalledWith(3, [
      `teachers/${ownerId}/quests/${questId}/tasks/${otherTaskId}/${fileId}.png`,
    ]);
    expect(mocks.remove).not.toHaveBeenCalledWith([
      `teachers/${ownerId}/quests/${questId}/tasks/${laterTaskId}/${fileId}.png`,
    ]);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("deletes a quest with no media through the existing owner-safe RPC", async () => {
    configure();

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "ok" });
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledOnce();
  });

  it("does not call the database delete RPC when cover cleanup fails", async () => {
    configure({
      quest: { id: questId, cover_image_path: coverPath() },
      removeResult: { error: { message: "RAW_STORAGE_ERROR" } },
    });

    const result = await deleteOwnedQuest(questId);
    expect(result).toEqual({ status: "error" });
    expect(JSON.stringify(result)).not.toContain("RAW_STORAGE_ERROR");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("does not call the database delete RPC when any task image cleanup fails", async () => {
    configure({ taskImages: [{ id: taskId, image_url: taskImageUrl() }] });
    mocks.remove.mockRejectedValue(new Error("RAW_STORAGE_THROW"));

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "error" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a noncanonical cover path from the owned database row", async () => {
    configure({
      quest: { id: questId, cover_image_path: "untrusted-cover.png" },
    });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "error" });
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a canonical-looking cover path owned by another teacher", async () => {
    configure({
      quest: { id: questId, cover_image_path: coverPath(otherOwnerId) },
    });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "error" });
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a noncanonical task path from the owned database row", async () => {
    configure({
      taskImages: [{ id: taskId, image_url: "https://attacker.example/path.png" }],
    });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "error" });
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a canonical-looking task path from another quest", async () => {
    configure({
      taskImages: [
        { id: taskId, image_url: taskImageUrl(taskId, ownerId, otherQuestId) },
      ],
    });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "error" });
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("surfaces a database delete failure after successful media cleanup", async () => {
    configure({
      quest: { id: questId, cover_image_path: coverPath() },
      rpcError: { message: "RAW_RPC_ERROR" },
    });

    const result = await deleteOwnedQuest(questId);
    expect(result).toEqual({ status: "error" });
    expect(mocks.remove).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenCalledOnce();
  });

  it("does not begin cleanup without active teacher authoring access", async () => {
    configure({ access: { status: "entitlement_inactive" } });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "error" });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("maps absent owned quest state without cleanup", async () => {
    configure({ quest: null });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "not_found" });
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
