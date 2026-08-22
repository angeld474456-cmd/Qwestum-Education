import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const taskId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const previousImageUrl = `https://example.supabase.co/storage/v1/object/public/quest-images/teachers/${userId}/quests/${questId}/tasks/${taskId}/44444444-4444-4444-8444-444444444444.png`;
const imageUrl = `https://example.supabase.co/storage/v1/object/public/quest-images/teachers/${userId}/quests/${questId}/tasks/${taskId}/55555555-5555-4555-8555-555555555555.png`;

const mocks = vi.hoisted(() => ({
  clearOwnedQuestTaskImage: vi.fn(),
  createClient: vi.fn(),
  getSafeQuestImageObjectPath: vi.fn(),
  getTeacherAuthoringAccess: vi.fn(),
  remove: vi.fn(),
  setOwnedQuestTaskImage: vi.fn(),
  storageFrom: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/storage/quest-image.server", () => ({
  getSafeQuestImageObjectPath: mocks.getSafeQuestImageObjectPath,
  questImageBucketName: "quest-images",
}));
vi.mock("@/services/teacher-task-image-mutation.server", () => ({
  clearOwnedQuestTaskImage: mocks.clearOwnedQuestTaskImage,
  setOwnedQuestTaskImage: mocks.setOwnedQuestTaskImage,
}));
vi.mock("@/services/teacher-authoring-access.server", () => ({
  getTeacherAuthoringAccess: mocks.getTeacherAuthoringAccess,
}));

import {
  DELETE,
  POST,
} from "@/app/api/teacher/quests/[id]/tasks/[taskId]/image/route";

const context = { params: Promise.resolve({ id: questId, taskId }) };

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

function configure(task: { id: string; image_url: string | null } | null) {
  mocks.getTeacherAuthoringAccess.mockResolvedValue({ status: "allowed", userId });
  const ownedQuest = query({ data: { id: questId }, error: null });
  const ownedTask = query({ data: task, error: null });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.storageFrom.mockReturnValue({
    upload: mocks.upload,
    remove: mocks.remove,
  });
  mocks.createClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }) },
    from: vi.fn().mockReturnValueOnce(ownedQuest).mockReturnValueOnce(ownedTask),
    storage: { from: mocks.storageFrom },
  });
}

function uploadRequest(expectedImageUrl = "") {
  const formData = new FormData();
  formData.append("file", new File(["image"], "image.png", { type: "image/png" }));
  formData.append("expectedImageUrl", expectedImageUrl);
  return new Request("http://example.test", { method: "POST", body: formData });
}

function deleteRequest(expectedImageUrl: string) {
  return new Request("http://example.test", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ expectedImageUrl }),
  });
}

describe("teacher task image route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads then commits image URL through SET with the current URL and object path", async () => {
    configure({ id: taskId, image_url: previousImageUrl });
    mocks.setOwnedQuestTaskImage.mockResolvedValue({
      status: "updated",
      id: taskId,
      previousImageUrl,
      imageUrl,
    });
    mocks.getSafeQuestImageObjectPath.mockReturnValue("old.png");

    const response = await POST(uploadRequest(previousImageUrl), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ imageUrl, storageDeleted: true });
    expect(mocks.setOwnedQuestTaskImage).toHaveBeenCalledWith(
      expect.objectContaining({
        questId,
        taskId,
        expectedImageUrl: previousImageUrl,
        newObjectPath: expect.stringMatching(/^teachers\//),
      })
    );
    expect(mocks.setOwnedQuestTaskImage.mock.calls[0][0]).not.toHaveProperty("imageUrl");
    expect(mocks.remove).toHaveBeenCalledWith(["old.png"]);
  });

  it.each(["POST", "DELETE"] as const)("denies inactive authoring access before %s ownership, Storage, or reference mutation", async (method) => {
    mocks.getTeacherAuthoringAccess.mockResolvedValue({ status: "entitlement_inactive" });

    const response = method === "POST"
      ? await POST(uploadRequest(), context)
      : await DELETE(deleteRequest(previousImageUrl), context);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Authoring access unavailable." });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.setOwnedQuestTaskImage).not.toHaveBeenCalled();
    expect(mocks.clearOwnedQuestTaskImage).not.toHaveBeenCalled();
  });

  it.each(["POST", "DELETE"] as const)("preserves the unauthenticated %s response", async (method) => {
    mocks.getTeacherAuthoringAccess.mockResolvedValue({ status: "unauthenticated" });

    const response = method === "POST"
      ? await POST(uploadRequest(), context)
      : await DELETE(deleteRequest(previousImageUrl), context);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("cleans only the new upload and returns 409 when SET is stale", async () => {
    configure({ id: taskId, image_url: imageUrl });
    mocks.getSafeQuestImageObjectPath.mockReturnValue("old.png");
    mocks.setOwnedQuestTaskImage.mockResolvedValue({
      status: "stale_image",
      id: taskId,
      previousImageUrl: imageUrl,
      imageUrl,
    });

    const response = await POST(uploadRequest(previousImageUrl), context);

    expect(response.status).toBe(409);
    expect(mocks.setOwnedQuestTaskImage).toHaveBeenCalledWith(
      expect.objectContaining({ expectedImageUrl: previousImageUrl })
    );
    expect(mocks.remove).toHaveBeenCalledTimes(1);
    expect(mocks.remove.mock.calls[0][0][0]).toMatch(/^teachers\//);
    expect(mocks.remove.mock.calls[0][0][0]).not.toBe("old.png");
  });

  it("cleans the new upload on zero-row and failed SET results", async () => {
    configure({ id: taskId, image_url: null });
    mocks.setOwnedQuestTaskImage.mockResolvedValue({ status: "not_found" });

    let response = await POST(uploadRequest(), context);
    expect(response.status).toBe(404);
    expect(mocks.remove).toHaveBeenCalledTimes(1);

    configure({ id: taskId, image_url: null });
    mocks.setOwnedQuestTaskImage.mockResolvedValue({ status: "error" });

    response = await POST(uploadRequest(), context);
    expect(response.status).toBe(500);
    expect(mocks.remove).toHaveBeenCalledTimes(2);
  });

  it("requires a client expected URL and maps cleared/stale outcomes safely", async () => {
    configure({ id: taskId, image_url: null });
    let response = await DELETE(new Request("http://example.test", { method: "DELETE" }), context);
    expect(response.status).toBe(400);
    expect(mocks.clearOwnedQuestTaskImage).not.toHaveBeenCalled();

    configure({ id: taskId, image_url: previousImageUrl });
    mocks.getSafeQuestImageObjectPath.mockReturnValue("old.png");
    mocks.clearOwnedQuestTaskImage.mockResolvedValue({
      status: "cleared",
      id: taskId,
      previousImageUrl,
      imageUrl: null,
    });
    mocks.getSafeQuestImageObjectPath.mockReturnValue("old.png");
    response = await DELETE(deleteRequest(previousImageUrl), context);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, imageUrl: null, storageDeleted: true });
    expect(mocks.clearOwnedQuestTaskImage).toHaveBeenCalledWith({
      questId,
      taskId,
      expectedImageUrl: previousImageUrl,
    });

    configure({ id: taskId, image_url: previousImageUrl });
    mocks.clearOwnedQuestTaskImage.mockResolvedValue({
      status: "stale_image",
      id: taskId,
      previousImageUrl: imageUrl,
      imageUrl,
    });
    response = await DELETE(deleteRequest(previousImageUrl), context);
    expect(response.status).toBe(409);
    expect(mocks.remove).toHaveBeenCalledTimes(1);

    configure({ id: taskId, image_url: null });
    mocks.getSafeQuestImageObjectPath.mockReturnValue("old.png");
    mocks.clearOwnedQuestTaskImage.mockResolvedValue({
      status: "stale_image",
      id: taskId,
      previousImageUrl: null,
      imageUrl: null,
    });
    response = await DELETE(deleteRequest(previousImageUrl), context);
    expect(response.status).toBe(409);
    expect(mocks.clearOwnedQuestTaskImage).toHaveBeenLastCalledWith({
      questId,
      taskId,
      expectedImageUrl: previousImageUrl,
    });
    expect(mocks.remove).toHaveBeenCalledTimes(1);
  });

  it("keeps committed SET and CLEAR responses successful when cleanup throws", async () => {
    configure({ id: taskId, image_url: previousImageUrl });
    mocks.setOwnedQuestTaskImage.mockResolvedValue({
      status: "updated",
      id: taskId,
      previousImageUrl,
      imageUrl,
    });
    mocks.getSafeQuestImageObjectPath.mockReturnValue("old.png");
    mocks.remove.mockRejectedValue(new Error("RAW_STORAGE_THROW"));

    let response = await POST(uploadRequest(previousImageUrl), context);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ imageUrl, storageDeleted: false });

    configure({ id: taskId, image_url: previousImageUrl });
    mocks.clearOwnedQuestTaskImage.mockResolvedValue({
      status: "cleared",
      id: taskId,
      previousImageUrl,
      imageUrl: null,
    });
    mocks.getSafeQuestImageObjectPath.mockReturnValue("old.png");
    mocks.remove.mockRejectedValue(new Error("RAW_STORAGE_THROW"));

    response = await DELETE(deleteRequest(previousImageUrl), context);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      imageUrl: null,
      storageDeleted: false,
    });
  });
});
