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

import { createOwnedQuestTask } from "@/services/teacher-task-creation.server";

const input = {
  questId,
  title: "Task",
  description: "Description",
  answer: "Answer",
  hint: "Hint",
  points: 2,
  taskType: "multiple_choice",
  content: {
    options: [
      { id: "option-a", text: "A" },
      { id: "option-b", text: "B" },
    ],
    correctOptionIds: ["option-a", "option-b"],
  },
};

function createdTask(overrides: Record<string, unknown> = {}) {
  return {
    outcome: "created",
    id: taskId,
    quest_id: questId,
    title: input.title,
    description: input.description,
    answer: input.answer,
    hint: input.hint,
    image_url: null,
    video_url: "",
    audio_url: "",
    content: input.content,
    points: input.points,
    task_type: input.taskType,
    sort_order: 3,
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

describe("createOwnedQuestTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls the owner-safe create RPC once with the exact allowlisted arguments", async () => {
    configure([createdTask()]);

    await expect(createOwnedQuestTask(input)).resolves.toEqual({
      status: "ok",
      task: expect.objectContaining({ id: taskId, sort_order: 3 }),
    });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith("create_owned_quest_task", {
      p_quest_id: questId,
      p_title: input.title,
      p_description: input.description,
      p_answer: input.answer,
      p_hint: input.hint,
      p_points: input.points,
      p_task_type: input.taskType,
      p_content: input.content,
    });
  });

  it("accepts the nullable image contract and rejects an empty image URL", async () => {
    configure([createdTask({ image_url: null })]);
    await expect(createOwnedQuestTask(input)).resolves.toMatchObject({
      status: "ok",
      task: { image_url: null },
    });

    configure([createdTask({ image_url: "" })]);
    await expect(createOwnedQuestTask(input)).resolves.toEqual({
      status: "error",
    });
  });

  it("accepts null choice-draft content without changing RPC arguments", async () => {
    const draftInput = { ...input, taskType: "multiple_choice", content: null };
    configure([createdTask({ task_type: "multiple_choice", content: null })]);

    await expect(createOwnedQuestTask(draftInput)).resolves.toMatchObject({
      status: "ok",
      task: { task_type: "multiple_choice", content: null },
    });
    expect(mocks.rpc).toHaveBeenCalledWith("create_owned_quest_task", expect.objectContaining({
      p_task_type: "multiple_choice",
      p_content: null,
    }));
  });

  it("returns unauthorized without calling the RPC", async () => {
    configure(null, null, null);

    await expect(createOwnedQuestTask(input)).resolves.toEqual({ status: "unauthorized" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("maps zero rows to owner-safe not_found", async () => {
    configure([]);
    await expect(createOwnedQuestTask(input)).resolves.toEqual({ status: "not_found" });
  });

  it("maps the exact task-limit outcome without exposing task data", async () => {
    configure([{
      outcome: "task_limit_reached",
      id: null,
      quest_id: null,
      title: null,
      description: null,
      answer: null,
      hint: null,
      image_url: null,
      video_url: null,
      audio_url: null,
      content: null,
      points: null,
      task_type: null,
      sort_order: null,
    }]);

    await expect(createOwnedQuestTask(input)).resolves.toEqual({ status: "task_limit_reached" });
  });

  it("maps RPC errors and throws to a safe error", async () => {
    configure(null, { message: "RAW_DATABASE_ERROR" });
    await expect(createOwnedQuestTask(input)).resolves.toEqual({ status: "error" });

    configure(null);
    mocks.rpc.mockRejectedValue(new Error("RAW_DATABASE_THROW"));
    await expect(createOwnedQuestTask(input)).resolves.toEqual({ status: "error" });
  });

  it("rejects malformed, unknown, and multiple RPC rows", async () => {
    configure([createdTask({ sort_order: "3" })]);
    await expect(createOwnedQuestTask(input)).resolves.toEqual({ status: "error" });

    configure([createdTask({ outcome: "unknown" })]);
    await expect(createOwnedQuestTask(input)).resolves.toEqual({ status: "error" });

    configure([createdTask(), createdTask()]);
    await expect(createOwnedQuestTask(input)).resolves.toEqual({ status: "error" });
  });
});
