import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const taskId = "22222222-2222-4222-8222-222222222222";
const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  deleteOwnedQuestTask: vi.fn(),
  getSafeQuestImageObjectPath: vi.fn(),
  remove: vi.fn(),
  storageFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/services/teacher-task-deletion.server", () => ({
  deleteOwnedQuestTask: mocks.deleteOwnedQuestTask,
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

describe("teacher task mutation route DELETE", () => {
  beforeEach(() => vi.clearAllMocks());

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
