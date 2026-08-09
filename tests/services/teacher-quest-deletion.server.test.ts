import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const ownerId = "22222222-2222-4222-8222-222222222222";
const taskId = "33333333-3333-4333-8333-333333333333";
const fileId = "44444444-4444-4444-8444-444444444444";
const origin = "https://project.example";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createClient: vi.fn(),
  from: vi.fn(),
  remove: vi.fn(),
  rpc: vi.fn(),
  storageFrom: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { deleteOwnedQuest } from "@/services/teacher-quest-deletion.server";

function taskImageUrl(id = taskId) {
  return `${origin}/storage/v1/object/public/quest-images/teachers/${ownerId}/quests/${questId}/tasks/${id}/${fileId}.png`;
}

function deletedRow(overrides: Record<string, unknown> = {}) {
  return {
    outcome: "deleted",
    id: questId,
    cover_image_path: null,
    task_image_urls: [],
    ...overrides,
  };
}

function configure(options?: {
  data?: unknown;
  error?: unknown;
  removeResult?: { error: unknown };
  user?: { id: string } | null;
}) {
  mocks.auth.mockResolvedValue({
    data: { user: options?.user === undefined ? { id: ownerId } : options.user },
  });
  mocks.rpc.mockResolvedValue({
    data: options?.data === undefined ? [deletedRow()] : options.data,
    error: options?.error ?? null,
  });
  mocks.remove.mockResolvedValue(options?.removeResult ?? { error: null });
  mocks.storageFrom.mockReturnValue({ remove: mocks.remove });
  mocks.createClient.mockResolvedValue({
    auth: { getUser: mocks.auth },
    from: mocks.from,
    rpc: mocks.rpc,
    storage: { from: mocks.storageFrom },
  });
}

describe("deleteOwnedQuest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = origin;
  });

  it("calls the delete RPC once with only the quest ID and performs no direct reads or writes", async () => {
    configure();

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "ok" });

    expect(mocks.rpc).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenCalledWith("delete_owned_quest", {
      p_quest_id: questId,
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("returns unauthorized without calling the RPC", async () => {
    configure({ user: null });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({
      status: "unauthorized",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it("maps zero RPC rows to owner-safe not_found without cleanup", async () => {
    configure({ data: [] });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({
      status: "not_found",
    });
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it("maps provider errors to a safe error without cleanup", async () => {
    configure({ error: { message: "RAW_RPC_ERROR" } });

    const result = await deleteOwnedQuest(questId);
    expect(result).toEqual({ status: "error" });
    expect(JSON.stringify(result)).not.toContain("RAW_RPC_ERROR");
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it.each([
    null,
    {},
    [deletedRow(), deletedRow()],
    [{ ...deletedRow(), outcome: "not_found" }],
    [{ ...deletedRow(), id: ownerId }],
    [{ ...deletedRow(), cover_image_path: 1 }],
    [{ ...deletedRow(), task_image_urls: null }],
    [{ ...deletedRow(), task_image_urls: [null] }],
    [{ ...deletedRow(), extra: true }],
  ])("rejects malformed RPC result %# without cleanup", async (data) => {
    configure({ data });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({
      status: "error",
    });
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it("cleans only canonical RPC-returned cover and deduplicated task image paths", async () => {
    const coverPath = `teachers/${ownerId}/quests/${questId}/cover/${fileId}.png`;
    configure({
      data: [
        deletedRow({
          cover_image_path: coverPath,
          task_image_urls: [taskImageUrl(), taskImageUrl()],
        }),
      ],
    });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "ok" });
    expect(mocks.storageFrom).toHaveBeenNthCalledWith(1, "quest-images");
    expect(mocks.remove).toHaveBeenNthCalledWith(1, [coverPath]);
    expect(mocks.storageFrom).toHaveBeenNthCalledWith(2, "quest-images");
    expect(mocks.remove).toHaveBeenNthCalledWith(2, [
      `teachers/${ownerId}/quests/${questId}/tasks/${taskId}/${fileId}.png`,
    ]);
  });

  it("ignores malformed and external RPC-returned cleanup references", async () => {
    configure({
      data: [
        deletedRow({
          cover_image_path: "legacy-cover.png",
          task_image_urls: [
            "https://other.example/object.png",
            `${origin}/storage/v1/object/public/quest-images/teachers/${ownerId}/quests/${questId}/tasks/not-a-uuid/${fileId}.png`,
          ],
        }),
      ],
    });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "ok" });
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it("keeps confirmed deletion successful when cleanup returns errors", async () => {
    const coverPath = `teachers/${ownerId}/quests/${questId}/cover/${fileId}.png`;
    configure({
      data: [
        deletedRow({
          cover_image_path: coverPath,
          task_image_urls: [taskImageUrl()],
        }),
      ],
      removeResult: { error: { message: "RAW_STORAGE_ERROR" } },
    });

    const result = await deleteOwnedQuest(questId);
    expect(result).toEqual({ status: "ok" });
    expect(JSON.stringify(result)).not.toContain("RAW_STORAGE_ERROR");
    expect(mocks.remove).toHaveBeenCalledTimes(2);
  });

  it("still attempts task cleanup when cover cleanup throws", async () => {
    const coverPath = `teachers/${ownerId}/quests/${questId}/cover/${fileId}.png`;
    configure({
      data: [
        deletedRow({
          cover_image_path: coverPath,
          task_image_urls: [taskImageUrl()],
        }),
      ],
    });
    mocks.remove
      .mockRejectedValueOnce(new Error("RAW_COVER_CLEANUP_ERROR"))
      .mockResolvedValueOnce({ error: null });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "ok" });
    expect(mocks.remove).toHaveBeenCalledTimes(2);
  });

  it("still attempts task cleanup when cover bucket access throws", async () => {
    const coverPath = `teachers/${ownerId}/quests/${questId}/cover/${fileId}.png`;
    configure({
      data: [
        deletedRow({
          cover_image_path: coverPath,
          task_image_urls: [taskImageUrl()],
        }),
      ],
    });
    mocks.storageFrom
      .mockImplementationOnce(() => {
        throw new Error("RAW_COVER_BUCKET_ERROR");
      })
      .mockReturnValueOnce({ remove: mocks.remove });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "ok" });
    expect(mocks.storageFrom).toHaveBeenCalledTimes(2);
    expect(mocks.remove).toHaveBeenCalledOnce();
  });

  it("keeps confirmed deletion successful when task cleanup throws", async () => {
    configure({ data: [deletedRow({ task_image_urls: [taskImageUrl()] })] });
    mocks.remove.mockRejectedValueOnce(new Error("RAW_TASK_CLEANUP_ERROR"));

    const result = await deleteOwnedQuest(questId);
    expect(result).toEqual({ status: "ok" });
    expect(JSON.stringify(result)).not.toContain("RAW_TASK_CLEANUP_ERROR");
  });
});
