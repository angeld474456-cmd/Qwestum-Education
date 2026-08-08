import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const taskId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const imageUrl = `https://example.supabase.co/storage/v1/object/public/quest-images/teachers/${userId}/quests/${questId}/tasks/${taskId}/44444444-4444-4444-8444-444444444444.png`;
const objectPath = `teachers/${userId}/quests/${questId}/tasks/${taskId}/44444444-4444-4444-8444-444444444444.png`;

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createClient: vi.fn(),
  getSafeQuestImageObjectPath: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/storage/quest-image.server", () => ({
  getSafeQuestImageObjectPath: mocks.getSafeQuestImageObjectPath,
}));

import {
  clearOwnedQuestTaskImage,
  setOwnedQuestTaskImage,
} from "@/services/teacher-task-image-mutation.server";

function configure(data: unknown, error: unknown = null, user: unknown = { id: userId }) {
  mocks.auth.mockResolvedValue({ data: { user } });
  mocks.rpc.mockResolvedValue({ data, error });
  mocks.createClient.mockResolvedValue({
    auth: { getUser: mocks.auth },
    rpc: mocks.rpc,
  });
  mocks.getSafeQuestImageObjectPath.mockReturnValue(objectPath);
}

function row(overrides: Record<string, unknown> = {}) {
  return {
    outcome: "updated",
    id: taskId,
    previous_image_url: null,
    image_url: imageUrl,
    ...overrides,
  };
}

describe("teacher task image mutation service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls SET exactly once with the allowlisted object-path arguments", async () => {
    configure([row()]);

    await expect(
      setOwnedQuestTaskImage({
        questId,
        taskId,
        expectedImageUrl: null,
        newObjectPath: objectPath,
      })
    ).resolves.toMatchObject({ status: "updated", imageUrl });

    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("set_owned_quest_task_image", {
      p_quest_id: questId,
      p_task_id: taskId,
      p_expected_image_url: null,
      p_new_object_path: objectPath,
    });
  });

  it("maps SET stale, zero, provider, malformed, multi-row, and wrong-id results safely", async () => {
    configure([row({ outcome: "stale_image", previous_image_url: imageUrl, image_url: imageUrl })]);
    await expect(setOwnedQuestTaskImage({ questId, taskId, expectedImageUrl: null, newObjectPath: objectPath })).resolves.toMatchObject({ status: "stale_image" });

    configure([]);
    await expect(setOwnedQuestTaskImage({ questId, taskId, expectedImageUrl: null, newObjectPath: objectPath })).resolves.toEqual({ status: "not_found" });

    configure(null, { message: "RAW_PROVIDER_ERROR" });
    await expect(setOwnedQuestTaskImage({ questId, taskId, expectedImageUrl: null, newObjectPath: objectPath })).resolves.toEqual({ status: "error" });

    for (const invalid of [
      row({ id: questId }),
      row({ outcome: "unknown" }),
    ]) {
      configure([invalid]);
      await expect(setOwnedQuestTaskImage({ questId, taskId, expectedImageUrl: null, newObjectPath: objectPath })).resolves.toEqual({ status: "error" });
    }

    configure([row({ image_url: "https://external.example/image.png" })]);
    mocks.getSafeQuestImageObjectPath.mockReturnValue(null);
    await expect(setOwnedQuestTaskImage({ questId, taskId, expectedImageUrl: null, newObjectPath: objectPath })).resolves.toEqual({ status: "error" });

    configure([row(), row()]);
    await expect(setOwnedQuestTaskImage({ questId, taskId, expectedImageUrl: null, newObjectPath: objectPath })).resolves.toEqual({ status: "error" });
  });

  it("calls CLEAR exactly once and rejects invalid clear outcomes", async () => {
    configure([row({ outcome: "cleared", previous_image_url: imageUrl, image_url: null })]);

    await expect(
      clearOwnedQuestTaskImage({ questId, taskId, expectedImageUrl: imageUrl })
    ).resolves.toMatchObject({ status: "cleared", previousImageUrl: imageUrl, imageUrl: null });

    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "clear_owned_quest_task_image_if_matches",
      {
        p_quest_id: questId,
        p_task_id: taskId,
        p_expected_image_url: imageUrl,
      }
    );

    configure([row({ outcome: "cleared", previous_image_url: imageUrl, image_url: imageUrl })]);
    await expect(
      clearOwnedQuestTaskImage({ questId, taskId, expectedImageUrl: imageUrl })
    ).resolves.toEqual({ status: "error" });
  });
});
