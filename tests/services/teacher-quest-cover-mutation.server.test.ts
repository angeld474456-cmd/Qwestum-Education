import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const previousPath = `teachers/${userId}/quests/${questId}/cover/33333333-3333-4333-8333-333333333333.png`;
const objectPath = `teachers/${userId}/quests/${questId}/cover/44444444-4444-4444-8444-444444444444.webp`;

const mocks = vi.hoisted(() => ({ auth: vi.fn(), createClient: vi.fn(), getSafePath: vi.fn(), rpc: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/storage/quest-cover.server", () => ({ getSafeQuestCoverImageObjectPath: mocks.getSafePath }));

import { clearOwnedQuestCoverImage, setOwnedQuestCoverImage } from "@/services/teacher-quest-cover-mutation.server";

function configure(data: unknown, error: unknown = null, user: unknown = { id: userId }) {
  mocks.auth.mockResolvedValue({ data: { user } });
  mocks.rpc.mockResolvedValue({ data, error });
  mocks.createClient.mockResolvedValue({ auth: { getUser: mocks.auth }, rpc: mocks.rpc });
  mocks.getSafePath.mockReturnValue(objectPath);
}

function row(overrides: Record<string, unknown> = {}) {
  return { outcome: "updated", id: questId, previous_cover_image_path: previousPath, cover_image_path: objectPath, ...overrides };
}

describe("teacher quest cover mutation service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls SET once with exact CAS arguments", async () => {
    configure([row({ previous_cover_image_path: null })]);

    await expect(setOwnedQuestCoverImage({ questId, expectedCoverImagePath: null, newObjectPath: objectPath })).resolves.toMatchObject({ status: "updated", coverImagePath: objectPath });
    expect(mocks.rpc).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenCalledWith("set_owned_quest_cover_image", {
      p_quest_id: questId,
      p_expected_cover_image_path: null,
      p_new_object_path: objectPath,
    });
  });

  it("maps SET no-op, stale, zero, auth, and malformed outcomes safely", async () => {
    configure([row({ outcome: "already_current", previous_cover_image_path: objectPath, cover_image_path: objectPath })]);
    await expect(setOwnedQuestCoverImage({ questId, expectedCoverImagePath: objectPath, newObjectPath: objectPath })).resolves.toMatchObject({ status: "already_current" });

    configure([row({ outcome: "stale_cover", cover_image_path: previousPath })]);
    await expect(setOwnedQuestCoverImage({ questId, expectedCoverImagePath: null, newObjectPath: objectPath })).resolves.toMatchObject({ status: "stale_cover" });

    configure([]);
    await expect(setOwnedQuestCoverImage({ questId, expectedCoverImagePath: null, newObjectPath: objectPath })).resolves.toEqual({ status: "not_found" });

    configure(null, null, null);
    await expect(setOwnedQuestCoverImage({ questId, expectedCoverImagePath: null, newObjectPath: objectPath })).resolves.toEqual({ status: "unauthorized" });

    configure([row({ id: userId })]);
    await expect(setOwnedQuestCoverImage({ questId, expectedCoverImagePath: null, newObjectPath: objectPath })).resolves.toEqual({ status: "error" });

    configure([row(), row()]);
    await expect(setOwnedQuestCoverImage({ questId, expectedCoverImagePath: null, newObjectPath: objectPath })).resolves.toEqual({ status: "error" });
  });

  it("calls CLEAR once and accepts only exact clear/no-op DTOs", async () => {
    configure([row({ outcome: "cleared", cover_image_path: null })]);
    await expect(clearOwnedQuestCoverImage({ questId, expectedCoverImagePath: previousPath })).resolves.toMatchObject({ status: "cleared", previousCoverImagePath: previousPath });
    expect(mocks.rpc).toHaveBeenCalledWith("clear_owned_quest_cover_image_if_matches", {
      p_quest_id: questId,
      p_expected_cover_image_path: previousPath,
    });

    configure([row({ outcome: "already_clear", previous_cover_image_path: null, cover_image_path: null })]);
    await expect(clearOwnedQuestCoverImage({ questId, expectedCoverImagePath: null })).resolves.toMatchObject({ status: "already_clear" });

    configure([row({ outcome: "cleared", cover_image_path: previousPath })]);
    await expect(clearOwnedQuestCoverImage({ questId, expectedCoverImagePath: previousPath })).resolves.toEqual({ status: "error" });
  });
});
