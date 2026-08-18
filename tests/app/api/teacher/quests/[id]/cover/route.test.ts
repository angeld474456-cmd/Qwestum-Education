import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const previousPath = `teachers/${userId}/quests/${questId}/cover/33333333-3333-4333-8333-333333333333.png`;
const objectPath = `teachers/${userId}/quests/${questId}/cover/44444444-4444-4444-8444-444444444444.png`;

const mocks = vi.hoisted(() => ({
  clear: vi.fn(), createClient: vi.fn(), getExtension: vi.fn(), getPublicUrl: vi.fn(), getSafePath: vi.fn(), getTeacherAuthoringAccess: vi.fn(), remove: vi.fn(), set: vi.fn(), storageFrom: vi.fn(), upload: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/storage/quest-cover.server", () => ({
  createQuestCoverImageObjectPath: () => objectPath,
  getQuestCoverImageExtension: mocks.getExtension,
  getQuestCoverImagePublicUrl: mocks.getPublicUrl,
  getSafeQuestCoverImageObjectPath: mocks.getSafePath,
  questCoverImageBucketName: "quest-images",
  questCoverImageMaxFileSize: 5 * 1024 * 1024,
}));
vi.mock("@/services/teacher-quest-cover-mutation.server", () => ({
  clearOwnedQuestCoverImage: mocks.clear,
  setOwnedQuestCoverImage: mocks.set,
}));
vi.mock("@/services/teacher-authoring-access.server", () => ({
  getTeacherAuthoringAccess: mocks.getTeacherAuthoringAccess,
}));

import { DELETE, POST } from "@/app/api/teacher/quests/[id]/cover/route";

const context = { params: Promise.resolve({ id: questId }) };

function query(quest: { id: string; cover_image_path: string | null } | null) {
  const builder = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: quest, error: null }) };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  return builder;
}

function configure(coverImagePath: string | null) {
  mocks.getTeacherAuthoringAccess.mockResolvedValue({ status: "allowed", userId });
  mocks.getExtension.mockReturnValue("png");
  mocks.getPublicUrl.mockImplementation((path) => path ? `https://example.test/${path}` : null);
  mocks.getSafePath.mockReturnValue("old.png");
  mocks.upload.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.storageFrom.mockReturnValue({ upload: mocks.upload, remove: mocks.remove });
  mocks.createClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } } }) },
    from: vi.fn().mockReturnValue(query({ id: questId, cover_image_path: coverImagePath })),
    storage: { from: mocks.storageFrom },
  });
}

function uploadRequest() {
  const formData = new FormData();
  formData.append("file", new File(["image"], "cover.png", { type: "image/png" }));
  return new Request("http://example.test", { method: "POST", body: formData });
}

describe("teacher quest cover route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads first, then attaches through SET and best-effort cleans the replaced cover", async () => {
    configure(previousPath);
    mocks.set.mockResolvedValue({ status: "updated", id: questId, previousCoverImagePath: previousPath, coverImagePath: objectPath });

    const response = await POST(uploadRequest(), context);

    expect(response.status).toBe(200);
    expect(mocks.set).toHaveBeenCalledWith({ questId, expectedCoverImagePath: previousPath, newObjectPath: objectPath });
    expect(mocks.remove).toHaveBeenCalledWith(["old.png"]);
  });

  it.each(["POST", "DELETE"] as const)("denies inactive authoring access before %s ownership, Storage, or reference mutation", async (method) => {
    mocks.getTeacherAuthoringAccess.mockResolvedValue({ status: "entitlement_inactive" });

    const response = method === "POST"
      ? await POST(uploadRequest(), context)
      : await DELETE(new Request("http://example.test", { method }), context);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Authoring access unavailable." });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.set).not.toHaveBeenCalled();
    expect(mocks.clear).not.toHaveBeenCalled();
  });

  it.each(["POST", "DELETE"] as const)("preserves the unauthenticated %s response", async (method) => {
    mocks.getTeacherAuthoringAccess.mockResolvedValue({ status: "unauthenticated" });

    const response = method === "POST"
      ? await POST(uploadRequest(), context)
      : await DELETE(new Request("http://example.test", { method }), context);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("cleans only the uploaded orphan when SET is stale or fails", async () => {
    configure(previousPath);
    mocks.set.mockResolvedValue({ status: "stale_cover", id: questId, previousCoverImagePath: previousPath, coverImagePath: previousPath });
    let response = await POST(uploadRequest(), context);
    expect(response.status).toBe(409);
    expect(mocks.remove).toHaveBeenCalledWith([objectPath]);

    configure(null);
    mocks.set.mockResolvedValue({ status: "error" });
    response = await POST(uploadRequest(), context);
    expect(response.status).toBe(500);
    expect(mocks.remove).toHaveBeenLastCalledWith([objectPath]);
  });

  it("does not clean an active cover for an already-current SET no-op", async () => {
    configure(objectPath);
    mocks.set.mockResolvedValue({ status: "already_current", id: questId, previousCoverImagePath: objectPath, coverImagePath: objectPath });

    const response = await POST(uploadRequest(), context);

    expect(response.status).toBe(200);
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("keeps a committed replacement successful when previous cleanup returns an error", async () => {
    configure(previousPath);
    mocks.set.mockResolvedValue({ status: "updated", id: questId, previousCoverImagePath: previousPath, coverImagePath: objectPath });
    mocks.remove.mockResolvedValue({ error: { message: "storage failed" } });

    const response = await POST(uploadRequest(), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ cover_image_path: objectPath });
  });

  it("clears through RPC and keeps DB success successful when cleanup fails", async () => {
    configure(previousPath);
    mocks.clear.mockResolvedValue({ status: "cleared", id: questId, previousCoverImagePath: previousPath, coverImagePath: null });
    mocks.remove.mockRejectedValue(new Error("storage failed"));

    const response = await DELETE(new Request("http://example.test", { method: "DELETE" }), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, cover_image_path: null, cover_image_url: null, storageDeleted: false });
    expect(mocks.clear).toHaveBeenCalledWith({ questId, expectedCoverImagePath: previousPath });
  });
});
