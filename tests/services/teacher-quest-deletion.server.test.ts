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
  storageFrom: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { deleteOwnedQuest } from "@/services/teacher-quest-deletion.server";

function taskImageUrl(id = taskId) {
  return `${origin}/storage/v1/object/public/quest-images/teachers/${ownerId}/quests/${questId}/tasks/${id}/${fileId}.png`;
}

function configure(options?: {
  user?: { id: string } | null;
  quest?: { id: string; cover_image_path: string | null } | null;
  questError?: unknown;
  tasks?: Array<{
    id: string;
    image_url: string | null;
    video_url?: string | null;
    audio_url?: string | null;
  }>;
  tasksError?: unknown;
  deletedQuest?: { id: string } | null;
  deleteError?: unknown;
  cleanupError?: unknown;
}) {
  const questQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  const tasksQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    delete: vi.fn(),
  };
  const deleteQuery = {
    delete: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
    maybeSingle: vi.fn(),
  };

  questQuery.select.mockReturnValue(questQuery);
  questQuery.eq.mockReturnValue(questQuery);
  questQuery.maybeSingle.mockResolvedValue({
    data: options?.quest === undefined
      ? { id: questId, cover_image_path: null }
      : options.quest,
    error: options?.questError ?? null,
  });
  tasksQuery.select.mockReturnValue(tasksQuery);
  tasksQuery.eq.mockResolvedValue({
    data: options?.tasks ?? [],
    error: options?.tasksError ?? null,
  });
  deleteQuery.delete.mockReturnValue(deleteQuery);
  deleteQuery.eq.mockReturnValue(deleteQuery);
  deleteQuery.select.mockReturnValue(deleteQuery);
  deleteQuery.maybeSingle.mockResolvedValue({
    data: options?.deletedQuest === undefined ? { id: questId } : options.deletedQuest,
    error: options?.deleteError ?? null,
  });

  mocks.auth.mockResolvedValue({
    data: { user: options?.user === undefined ? { id: ownerId } : options.user },
  });
  mocks.from
    .mockImplementationOnce(() => questQuery)
    .mockImplementationOnce(() => tasksQuery)
    .mockImplementationOnce(() => deleteQuery);
  mocks.remove.mockResolvedValue({ error: options?.cleanupError ?? null });
  mocks.storageFrom.mockReturnValue({ remove: mocks.remove });
  mocks.createClient.mockResolvedValue({
    auth: { getUser: mocks.auth },
    from: mocks.from,
    storage: { from: mocks.storageFrom },
  });

  return { questQuery, tasksQuery, deleteQuery };
}

describe("deleteOwnedQuest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = origin;
  });

  it("prefetches and deletes only the authenticated owner's quest without deleting tasks directly", async () => {
    const { questQuery, tasksQuery, deleteQuery } = configure();

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "ok" });
    expect(questQuery.select).toHaveBeenCalledWith("id, cover_image_path");
    expect(questQuery.eq).toHaveBeenNthCalledWith(1, "id", questId);
    expect(questQuery.eq).toHaveBeenNthCalledWith(2, "author_id", ownerId);
    expect(tasksQuery.select).toHaveBeenCalledWith("id, image_url");
    expect(tasksQuery.eq).toHaveBeenCalledWith("quest_id", questId);
    expect(tasksQuery.delete).not.toHaveBeenCalled();
    expect(deleteQuery.delete).toHaveBeenCalledOnce();
    expect(deleteQuery.eq).toHaveBeenNthCalledWith(1, "id", questId);
    expect(deleteQuery.eq).toHaveBeenNthCalledWith(2, "author_id", ownerId);
  });

  it("returns owner-safe not_found without cleanup for missing or foreign quests", async () => {
    configure({ quest: null });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({
      status: "not_found",
    });
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it("returns unauthorized without querying database rows", async () => {
    configure({ user: null });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({
      status: "unauthorized",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("fails safely for database errors without exposing raw detail", async () => {
    configure({ deleteError: { message: "RAW_DELETE_ERROR" } });

    const result = await deleteOwnedQuest(questId);
    expect(result).toEqual({ status: "error" });
    expect(JSON.stringify(result)).not.toContain("RAW_DELETE_ERROR");
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it("returns not_found without cleanup when the owner-scoped delete returns no row", async () => {
    const { deleteQuery } = configure({ deletedQuest: null });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({
      status: "not_found",
    });
    expect(deleteQuery.delete).toHaveBeenCalledOnce();
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it("does not delete or clean up when task prefetch fails", async () => {
    const { deleteQuery } = configure({
      tasksError: { message: "RAW_TASK_PREFETCH_ERROR" },
    });

    const result = await deleteOwnedQuest(questId);
    expect(result).toEqual({ status: "error" });
    expect(JSON.stringify(result)).not.toContain("RAW_TASK_PREFETCH_ERROR");
    expect(deleteQuery.delete).not.toHaveBeenCalled();
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it("cleans only deduplicated canonical cover and task image paths", async () => {
    const coverPath = `teachers/${ownerId}/quests/${questId}/cover/${fileId}.png`;
    configure({
      quest: { id: questId, cover_image_path: coverPath },
      tasks: [
        { id: taskId, image_url: taskImageUrl() },
        { id: taskId, image_url: taskImageUrl() },
      ],
    });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "ok" });
    expect(mocks.remove).toHaveBeenNthCalledWith(1, [coverPath]);
    expect(mocks.remove).toHaveBeenNthCalledWith(2, [
      `teachers/${ownerId}/quests/${questId}/tasks/${taskId}/${fileId}.png`,
    ]);
  });

  it("ignores malformed, legacy, video, and audio media values", async () => {
    configure({
      quest: { id: questId, cover_image_path: "legacy-cover.png" },
      tasks: [
        {
          id: taskId,
          image_url: "https://other.example/object.png",
          video_url: "https://other.example/video.mp4",
          audio_url: "https://other.example/audio.mp3",
        },
      ],
    });

    await expect(deleteOwnedQuest(questId)).resolves.toEqual({ status: "ok" });
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it("keeps a confirmed deletion successful when storage cleanup fails", async () => {
    configure({
      quest: {
        id: questId,
        cover_image_path: `teachers/${ownerId}/quests/${questId}/cover/${fileId}.png`,
      },
      cleanupError: { message: "RAW_STORAGE_ERROR" },
    });

    const result = await deleteOwnedQuest(questId);
    expect(result).toEqual({ status: "ok" });
    expect(JSON.stringify(result)).not.toContain("RAW_STORAGE_ERROR");
  });

  it("still attempts task cleanup when cover cleanup throws", async () => {
    const coverPath = `teachers/${ownerId}/quests/${questId}/cover/${fileId}.png`;
    configure({
      quest: { id: questId, cover_image_path: coverPath },
      tasks: [{ id: taskId, image_url: taskImageUrl() }],
    });
    mocks.remove
      .mockRejectedValueOnce(new Error("RAW_COVER_CLEANUP_ERROR"))
      .mockResolvedValueOnce({ error: null });

    const result = await deleteOwnedQuest(questId);
    expect(result).toEqual({ status: "ok" });
    expect(mocks.remove).toHaveBeenNthCalledWith(1, [coverPath]);
    expect(mocks.remove).toHaveBeenNthCalledWith(2, [
      `teachers/${ownerId}/quests/${questId}/tasks/${taskId}/${fileId}.png`,
    ]);
    expect(JSON.stringify(result)).not.toContain("RAW_COVER_CLEANUP_ERROR");
  });
});
