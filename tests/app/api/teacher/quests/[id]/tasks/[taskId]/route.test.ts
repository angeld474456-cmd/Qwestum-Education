import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const taskId = "22222222-2222-4222-8222-222222222222";
const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  deleteOwnedQuestTask: vi.fn(),
  getTeacherAuthoringAccess: vi.fn(),
  updateOwnedQuestTask: vi.fn(),
  getSafeQuestImageObjectPath: vi.fn(),
  remove: vi.fn(),
  storageFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/services/teacher-task-deletion.server", () => ({
  deleteOwnedQuestTask: mocks.deleteOwnedQuestTask,
}));
vi.mock("@/services/teacher-authoring-access.server", () => ({
  getTeacherAuthoringAccess: mocks.getTeacherAuthoringAccess,
}));
vi.mock("@/services/teacher-task-update.server", () => ({
  updateOwnedQuestTask: mocks.updateOwnedQuestTask,
}));
vi.mock("@/lib/storage/quest-image.server", () => ({
  getSafeQuestImageObjectPath: mocks.getSafeQuestImageObjectPath,
  questImageBucketName: "quest-images",
}));

import {
  DELETE,
  PATCH,
} from "@/app/api/teacher/quests/[id]/tasks/[taskId]/route";

const context = { params: Promise.resolve({ id: questId, taskId }) };

function deleteRequest() {
  return new Request("http://example.test", { method: "DELETE" });
}

function patchRequest(body: unknown) {
  return new Request("http://example.test", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function deleted(imageUrl: string | null) {
  return {
    status: "deleted",
    id: taskId,
    imageUrl,
    userId: "owner",
  };
}

function configureStorage(removeError: unknown = null) {
  mocks.remove.mockResolvedValue({ error: removeError });
  mocks.storageFrom.mockReturnValue({ remove: mocks.remove });
  mocks.createClient.mockResolvedValue({
    storage: { from: mocks.storageFrom },
  });
}

function query(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  return builder;
}

function configurePatch(currentTask: Record<string, unknown>) {
  const ownedQuest = query({ data: { id: questId, is_public: false }, error: null });
  const task = query({ data: currentTask, error: null });
  mocks.createClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "owner" } } }) },
    from: vi.fn((table: string) => (table === "quests" ? ownedQuest : task)),
  });
}

function taskDto(overrides: Record<string, unknown> = {}) {
  return {
    id: taskId,
    quest_id: questId,
    title: "Task",
    description: "Description",
    answer: null,
    hint: null,
    image_url: null,
    video_url: null,
    audio_url: null,
    content: null,
    points: 1,
    task_type: "text",
    sort_order: 1,
    ...overrides,
  };
}

describe("teacher task mutation route DELETE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTeacherAuthoringAccess.mockResolvedValue({
      status: "allowed",
      userId: "owner",
    });
  });

  it("denies inactive authoring access before task deletion and Storage cleanup", async () => {
    mocks.getTeacherAuthoringAccess.mockResolvedValue({ status: "entitlement_inactive" });

    const response = await DELETE(deleteRequest(), context);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Authoring access unavailable." });
    expect(mocks.deleteOwnedQuestTask).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("preserves the unauthenticated response before task deletion", async () => {
    mocks.getTeacherAuthoringAccess.mockResolvedValue({ status: "unauthenticated" });

    const response = await DELETE(deleteRequest(), context);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
    expect(mocks.deleteOwnedQuestTask).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("maps unauthenticated, missing, public-final-task, and error outcomes safely", async () => {
    const cases = [
      [{ status: "unauthorized" }, 401, { error: "Unauthorized." }],
      [{ status: "not_found" }, 404, { error: "Task not found." }],
      [
        { status: "last_public_task" },
        400,
        {
          error:
            "\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0441\u043d\u0438\u043c\u0438\u0442\u0435 \u043a\u0432\u0435\u0441\u0442 \u0441 \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u0438, \u0437\u0430\u0442\u0435\u043c \u0443\u0434\u0430\u043b\u0438\u0442\u0435 \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0435\u0435 \u0437\u0430\u0434\u0430\u043d\u0438\u0435.",
        },
      ],
      [{ status: "error" }, 500, { error: "Unable to delete task." }],
    ] as const;

    for (const [outcome, status, body] of cases) {
      mocks.deleteOwnedQuestTask.mockResolvedValue(outcome);
      const response = await DELETE(deleteRequest(), context);
      expect(response.status).toBe(status);
      await expect(response.json()).resolves.toEqual(body);
    }

    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.getSafeQuestImageObjectPath).not.toHaveBeenCalled();
  });

  it("keeps malformed identifiers on the existing safe not-found response", async () => {
    const response = await DELETE(deleteRequest(), {
      params: Promise.resolve({ id: "not-a-uuid", taskId }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Task not found." });
    expect(mocks.deleteOwnedQuestTask).not.toHaveBeenCalled();
  });

  it("deletes without Storage cleanup when the deleted task has no image", async () => {
    mocks.deleteOwnedQuestTask.mockResolvedValue(deleted(null));

    const response = await DELETE(deleteRequest(), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, storageDeleted: false });
    expect(mocks.deleteOwnedQuestTask).toHaveBeenCalledWith(questId, taskId);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("performs canonical image cleanup only after a confirmed deletion", async () => {
    mocks.deleteOwnedQuestTask.mockResolvedValue(
      deleted("https://example.test/image.png")
    );
    mocks.getSafeQuestImageObjectPath.mockReturnValue(
      "teachers/owner/quests/quest/tasks/task/image.png"
    );
    configureStorage();

    const response = await DELETE(deleteRequest(), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, storageDeleted: true });
    expect(mocks.getSafeQuestImageObjectPath).toHaveBeenCalledWith(
      "https://example.test/image.png",
      "owner",
      questId,
      taskId
    );
    expect(mocks.storageFrom).toHaveBeenCalledWith("quest-images");
    expect(mocks.remove).toHaveBeenCalledWith([
      "teachers/owner/quests/quest/tasks/task/image.png",
    ]);
  });

  it("keeps confirmed deletion successful when canonical image cleanup fails", async () => {
    mocks.deleteOwnedQuestTask.mockResolvedValue(
      deleted("https://example.test/image.png")
    );
    mocks.getSafeQuestImageObjectPath.mockReturnValue(
      "teachers/owner/quests/quest/tasks/task/image.png"
    );
    configureStorage({ message: "RAW_STORAGE_ERROR" });

    const response = await DELETE(deleteRequest(), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, storageDeleted: false });
  });

  it("keeps confirmed deletion successful when canonical image cleanup throws", async () => {
    mocks.deleteOwnedQuestTask.mockResolvedValue(
      deleted("https://example.test/image.png")
    );
    mocks.getSafeQuestImageObjectPath.mockReturnValue(
      "teachers/owner/quests/quest/tasks/task/image.png"
    );
    configureStorage();
    mocks.remove.mockRejectedValue(new Error("RAW_STORAGE_THROW"));

    const response = await DELETE(deleteRequest(), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, storageDeleted: false });
  });

  it("keeps confirmed deletion successful when Storage client access throws", async () => {
    mocks.deleteOwnedQuestTask.mockResolvedValue(
      deleted("https://example.test/image.png")
    );
    mocks.getSafeQuestImageObjectPath.mockReturnValue(
      "teachers/owner/quests/quest/tasks/task/image.png"
    );
    mocks.createClient.mockRejectedValue(new Error("RAW_STORAGE_CLIENT_THROW"));

    const response = await DELETE(deleteRequest(), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, storageDeleted: false });
  });

  it("does not perform Storage cleanup when the service does not confirm deletion", async () => {
    const outcomes = [
      { status: "not_found" },
      { status: "last_public_task" },
      { status: "error" },
    ];

    for (const outcome of outcomes) {
      mocks.deleteOwnedQuestTask.mockResolvedValue(outcome);
      await DELETE(deleteRequest(), context);
    }

    expect(mocks.getSafeQuestImageObjectPath).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("leaves PATCH malformed-request behavior unchanged", async () => {
    const response = await PATCH(patchRequest("not-json"), context);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid JSON payload.",
    });
    expect(mocks.deleteOwnedQuestTask).not.toHaveBeenCalled();
  });
});

describe("teacher task mutation route PATCH", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects invalid metadata and mixed image payloads before the RPC", async () => {
    for (const body of [
      { title: "" },
      { title: "x".repeat(501) },
      { description: "x".repeat(10001) },
      { points: 0 },
      { title: "Task", image_url: "https://example.test/image.png" },
    ]) {
      const response = await PATCH(patchRequest(body), context);
      expect(response.status).toBe(400);
    }

    expect(mocks.updateOwnedQuestTask).not.toHaveBeenCalled();
  });

  it("uses the metadata RPC and preserves the success DTO", async () => {
    const current = taskDto();
    configurePatch(current);
    mocks.updateOwnedQuestTask.mockResolvedValue({ status: "updated", task: taskDto({ title: "Updated" }) });

    const response = await PATCH(patchRequest({ title: "Updated" }), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ task: taskDto({ title: "Updated" }) });
    expect(mocks.updateOwnedQuestTask).toHaveBeenCalledWith({
      questId,
      taskId,
      title: "Updated",
      description: "Description",
      points: 1,
      content: null,
    });
  });

  it("validates malformed Single Choice and Multiple Choice content before calling the RPC", async () => {
    configurePatch(taskDto({ task_type: "single_choice", content: { options: [], correctOptionId: "a" } }));

    let response = await PATCH(patchRequest({ content: { options: [], correctOptionId: "a" } }), context);

    expect(response.status).toBe(400);
    expect(mocks.updateOwnedQuestTask).not.toHaveBeenCalled();

    configurePatch(taskDto({ task_type: "multiple_choice", content: { options: [], correctOptionIds: [] } }));

    response = await PATCH(patchRequest({ content: { options: [], correctOptionIds: [] } }), context);

    expect(response.status).toBe(400);
    expect(mocks.updateOwnedQuestTask).not.toHaveBeenCalled();
  });

  it("keeps null choice drafts editable", async () => {
    configurePatch(taskDto({ task_type: "single_choice", content: null }));
    mocks.updateOwnedQuestTask.mockResolvedValue({ status: "updated", task: taskDto({ task_type: "single_choice", content: null }) });

    const response = await PATCH(patchRequest({ title: "Updated" }), context);

    expect(response.status).toBe(200);
    expect(mocks.updateOwnedQuestTask).toHaveBeenCalledWith(expect.objectContaining({ content: null }));
  });

  it("maps metadata service outcomes without direct update", async () => {
    configurePatch(taskDto());
    mocks.updateOwnedQuestTask.mockResolvedValueOnce({ status: "not_found" });
    let response = await PATCH(patchRequest({ title: "Updated" }), context);
    expect(response.status).toBe(404);

    configurePatch(taskDto());
    mocks.updateOwnedQuestTask.mockResolvedValueOnce({ status: "error" });
    response = await PATCH(patchRequest({ title: "Updated" }), context);
    expect(response.status).toBe(500);
  });

  it("rejects image-only PATCH before any direct task update", async () => {
    const response = await PATCH(
      patchRequest({ image_url: "https://example.test/new.png" }),
      context
    );

    expect(response.status).toBe(400);
    expect(mocks.updateOwnedQuestTask).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
