import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const taskId = "22222222-2222-4222-8222-222222222222";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import {
  updateOwnedQuestTask,
  updateOwnedQuestTaskV2,
} from "@/services/teacher-task-update.server";

const input = {
  questId,
  taskId,
  title: "Task",
  description: "Description",
  points: 2,
  content: null,
};

function updatedTask(overrides: Record<string, unknown> = {}) {
  return {
    id: taskId,
    quest_id: questId,
    title: input.title,
    description: input.description,
    answer: null,
    hint: null,
    image_url: null,
    video_url: null,
    audio_url: null,
    content: input.content,
    points: input.points,
    task_type: "text",
    sort_order: 1,
    ...overrides,
  };
}

function updatedTaskV2(overrides: Record<string, unknown> = {}) {
  return {
    ...updatedTask(),
    narrative_intro: null,
    narrative_success: "Task complete.",
    ...overrides,
  };
}

function configure(data: unknown, error: unknown = null, user: unknown = { id: "owner" }) {
  mocks.auth.mockResolvedValue({ data: { user } });
  mocks.rpc.mockResolvedValue({ data, error });
  mocks.createClient.mockResolvedValue({
    auth: { getUser: mocks.auth },
    rpc: mocks.rpc,
  });
}

describe("updateOwnedQuestTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls the metadata RPC once with the exact allowlisted arguments", async () => {
    configure([updatedTask()]);

    await expect(updateOwnedQuestTask(input)).resolves.toEqual({
      status: "updated",
      task: expect.objectContaining({ id: taskId, task_type: "text" }),
    });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("update_owned_quest_task_content", {
      p_quest_id: questId,
      p_task_id: taskId,
      p_title: input.title,
      p_description: input.description,
      p_points: input.points,
      p_content: input.content,
    });
  });

  it("accepts valid Single Choice and Multiple Choice DTOs", async () => {
    configure([updatedTask({
      task_type: "single_choice",
      content: { options: [{ id: "a", text: "A" }, { id: "b", text: "B" }], correctOptionId: "a" },
    })]);
    await expect(updateOwnedQuestTask({ ...input, content: { options: [], correctOptionId: "a" } })).resolves.toMatchObject({ status: "updated" });

    configure([updatedTask({
      task_type: "multiple_choice",
      content: { options: [{ id: "a", text: "A" }, { id: "b", text: "B" }], correctOptionIds: ["a", "b"] },
    })]);
    await expect(updateOwnedQuestTask({ ...input, content: { options: [], correctOptionIds: [] } })).resolves.toMatchObject({ status: "updated" });
  });

  it("maps zero rows, provider errors, and malformed identifiers safely", async () => {
    configure([]);
    await expect(updateOwnedQuestTask(input)).resolves.toEqual({ status: "not_found" });

    configure(null, { message: "RAW_DATABASE_ERROR" });
    await expect(updateOwnedQuestTask(input)).resolves.toEqual({ status: "error" });

    await expect(updateOwnedQuestTask({ ...input, taskId: "invalid" })).resolves.toEqual({ status: "error" });
  });

  it("rejects malformed, inconsistent, unsupported, and multiple result rows", async () => {
    const invalidRows = [
      updatedTask({ quest_id: "33333333-3333-4333-8333-333333333333" }),
      updatedTask({ task_type: "unknown" }),
      updatedTask({ content: [] }),
      updatedTask({ sort_order: "1" }),
    ];

    for (const row of invalidRows) {
      configure([row]);
      await expect(updateOwnedQuestTask(input)).resolves.toEqual({ status: "error" });
    }

    configure([updatedTask(), updatedTask()]);
    await expect(updateOwnedQuestTask(input)).resolves.toEqual({ status: "error" });
  });
});

describe("updateOwnedQuestTaskV2", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the versioned owner-safe RPC and maps nullable narrative fields", async () => {
    configure([updatedTaskV2()]);
    const v2Input = {
      ...input,
      narrativeIntro: "  ",
      narrativeSuccess: "Task complete.",
    };

    await expect(updateOwnedQuestTaskV2(v2Input)).resolves.toEqual({
      status: "updated",
      task: expect.objectContaining({
        id: taskId,
        narrative_intro: null,
        narrative_success: "Task complete.",
      }),
    });
    expect(mocks.rpc).toHaveBeenCalledWith("update_owned_quest_task_content_v2", {
      p_quest_id: questId,
      p_task_id: taskId,
      p_title: input.title,
      p_description: input.description,
      p_points: input.points,
      p_content: input.content,
      p_narrative_intro: "  ",
      p_narrative_success: "Task complete.",
    });
  });

  it("fails closed for malformed or private v2 task fields", async () => {
    const v2Input = {
      ...input,
      narrativeIntro: null,
      narrativeSuccess: null,
    };

    configure([updatedTaskV2({ owner_id: "private" })]);
    await expect(updateOwnedQuestTaskV2(v2Input)).resolves.toEqual({
      status: "error",
    });

    configure([updatedTaskV2({ narrative_success: 1 })]);
    await expect(updateOwnedQuestTaskV2(v2Input)).resolves.toEqual({
      status: "error",
    });
  });
});
