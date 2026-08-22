import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  malformedRuntimeQuestRow,
  malformedRuntimeResultRow,
  publicRuntimeQuestRow,
  publicRuntimeResult,
  publicRuntimeResultRow,
  publicRuntimeResultWithUnanswered,
  publicRuntimeResultWithUnansweredRow,
  runtimeQuestId,
  optionIds,
  singleChoiceTaskIds,
  textTaskIds,
  validSubmission,
} from "@/tests/fixtures/public-runtime";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import {
  getPublicRuntimeQuest,
  getPublicRuntimeQuestV2,
  scorePublicRuntimeQuest,
} from "@/services/public-runtime.server";

function validV2RuntimeRow(): Record<string, unknown> {
  return {
    id: runtimeQuestId,
    title: "Narrative quest",
    description: "Safe description",
    mission_intro: "Mission briefing",
    mission_outro: null,
    tasks: [
      {
        id: textTaskIds[0],
        task_type: "text",
        title: "Text task",
        description: null,
        narrative_intro: "Arrive at the first stop.",
        narrative_success: null,
        image_url: null,
      },
      {
        id: singleChoiceTaskIds[0],
        task_type: "single_choice",
        title: "Single Choice task",
        description: "Choose safely.",
        narrative_intro: null,
        narrative_success: "The route is clear.",
        image_url: null,
        options: [
          { id: optionIds[0], text: "Option one" },
          { id: optionIds[1], text: "Option two" },
        ],
      },
      {
        id: singleChoiceTaskIds[1],
        task_type: "multiple_choice",
        title: "Multiple Choice task",
        description: null,
        narrative_intro: null,
        narrative_success: null,
        image_url: null,
        options: [
          { id: optionIds[2], text: "Option three" },
          { id: optionIds[3], text: "Option four" },
        ],
      },
    ],
  };
}

function choiceTask(row: Record<string, unknown>) {
  return (row.tasks as Record<string, unknown>[])[1];
}

describe("public runtime server service", () => {
  beforeEach(() => {
    mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
  });

  it("maps the allowlisted runtime fetch DTO and discards extra RPC fields", async () => {
    mocks.rpc.mockResolvedValue({ data: [publicRuntimeQuestRow], error: null });

    const quest = await getPublicRuntimeQuest(runtimeQuestId);

    expect(quest).toEqual({
      id: publicRuntimeQuestRow.id,
      title: publicRuntimeQuestRow.title,
      description: publicRuntimeQuestRow.description,
      tasks: [
        ...publicRuntimeQuestRow.tasks.slice(0, 4).map((task) => ({
          id: task.id,
          taskType: "text",
          title: task.title,
          description: task.description,
          imageUrl: task.image_url,
        })),
        {
          id: publicRuntimeQuestRow.tasks[4].id,
          taskType: "single_choice",
          title: publicRuntimeQuestRow.tasks[4].title,
          description: publicRuntimeQuestRow.tasks[4].description,
          imageUrl: publicRuntimeQuestRow.tasks[4].image_url,
          options: publicRuntimeQuestRow.tasks[4].options.map((option) => ({
            id: option.id,
            text: option.text,
          })),
        },
        {
          id: publicRuntimeQuestRow.tasks[5].id,
          taskType: "multiple_choice",
          title: publicRuntimeQuestRow.tasks[5].title,
          description: publicRuntimeQuestRow.tasks[5].description,
          imageUrl: publicRuntimeQuestRow.tasks[5].image_url,
          options: publicRuntimeQuestRow.tasks[5].options.map((option) => ({
            id: option.id,
            text: option.text,
          })),
        },
      ],
    });
    expect(mocks.rpc).toHaveBeenCalledWith("get_public_runtime_quest", {
      p_quest_id: runtimeQuestId,
    });
    expect(JSON.stringify(quest)).not.toContain("private answer");
    expect(JSON.stringify(quest)).not.toContain("correctOptionId");
    expect(JSON.stringify(quest)).not.toContain("correctOptionIds");
  });

  it("returns null for an unavailable runtime quest", async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });

    await expect(getPublicRuntimeQuest(runtimeQuestId)).resolves.toBeNull();
  });

  it("maps the narrative v2 runtime DTO through its dedicated RPC", async () => {
    const v2Row = validV2RuntimeRow();
    mocks.rpc.mockResolvedValue({ data: [v2Row], error: null });

    await expect(getPublicRuntimeQuestV2(runtimeQuestId)).resolves.toEqual({
      id: runtimeQuestId,
      title: "Narrative quest",
      description: "Safe description",
      missionIntro: "Mission briefing",
      missionOutro: null,
      tasks: [
        {
          id: textTaskIds[0],
          taskType: "text",
          title: "Text task",
          description: null,
          narrativeIntro: "Arrive at the first stop.",
          narrativeSuccess: null,
          imageUrl: null,
        },
        {
          id: singleChoiceTaskIds[0],
          taskType: "single_choice",
          title: "Single Choice task",
          description: "Choose safely.",
          narrativeIntro: null,
          narrativeSuccess: "The route is clear.",
          imageUrl: null,
          options: [
            { id: optionIds[0], text: "Option one" },
            { id: optionIds[1], text: "Option two" },
          ],
        },
        {
          id: singleChoiceTaskIds[1],
          taskType: "multiple_choice",
          title: "Multiple Choice task",
          description: null,
          narrativeIntro: null,
          narrativeSuccess: null,
          imageUrl: null,
          options: [
            { id: optionIds[2], text: "Option three" },
            { id: optionIds[3], text: "Option four" },
          ],
        },
      ],
    });
    expect(mocks.rpc).toHaveBeenCalledWith("get_public_runtime_quest_v2", {
      p_quest_id: runtimeQuestId,
    });
  });

  it("fails closed when the v2 runtime DTO contains a private field", async () => {
    const v2Row = validV2RuntimeRow();
    choiceTask(v2Row).answer = "private answer";
    mocks.rpc.mockResolvedValue({
      data: [v2Row],
      error: null,
    });

    await expect(getPublicRuntimeQuestV2(runtimeQuestId)).rejects.toThrow(
      "Public runtime fetch returned invalid data."
    );
  });

  it.each([
    ["content", {}],
    ["correctOptionId", optionIds[0]],
    ["correctOptionIds", [optionIds[0]]],
    ["author_id", runtimeQuestId],
    ["authorId", runtimeQuestId],
    ["owner_id", runtimeQuestId],
    ["ownerId", runtimeQuestId],
    ["points", 1],
    ["answer", "private answer"],
    ["unexpected", true],
  ])("rejects v2 task-root field %s", async (key, value) => {
    const v2Row = validV2RuntimeRow();
    choiceTask(v2Row)[key] = value;
    mocks.rpc.mockResolvedValue({ data: [v2Row], error: null });

    await expect(getPublicRuntimeQuestV2(runtimeQuestId)).rejects.toThrow(
      "Public runtime fetch returned invalid data."
    );
  });

  it.each([
    ["correctOptionId", optionIds[0]],
    ["correct", true],
    ["isCorrect", true],
    ["points", 1],
    ["content", {}],
    ["answer", "private answer"],
    ["unexpected", true],
  ])("rejects v2 option field %s", async (key, value) => {
    const v2Row = validV2RuntimeRow();
    const options = choiceTask(v2Row).options as Record<string, unknown>[];
    options[0][key] = value;
    mocks.rpc.mockResolvedValue({ data: [v2Row], error: null });

    await expect(getPublicRuntimeQuestV2(runtimeQuestId)).rejects.toThrow(
      "Public runtime fetch returned invalid data."
    );
  });

  it.each([
    ["missing id", { text: "Option one" }],
    ["missing text", { id: optionIds[0] }],
    ["blank id", { id: " ", text: "Option one" }],
    ["invalid text", { id: optionIds[0], text: 1 }],
    ["array", []],
    ["null", null],
  ])("rejects malformed v2 option: %s", async (_label, option) => {
    const v2Row = validV2RuntimeRow();
    const options = choiceTask(v2Row).options as unknown[];
    options[0] = option;
    mocks.rpc.mockResolvedValue({ data: [v2Row], error: null });

    await expect(getPublicRuntimeQuestV2(runtimeQuestId)).rejects.toThrow(
      "Public runtime fetch returned invalid data."
    );
  });

  it("accepts v2 rows with all narrative fields null", async () => {
    const v2Row = validV2RuntimeRow();
    v2Row.mission_intro = null;
    v2Row.mission_outro = null;
    for (const task of v2Row.tasks as Record<string, unknown>[]) {
      task.narrative_intro = null;
      task.narrative_success = null;
    }
    mocks.rpc.mockResolvedValue({ data: [v2Row], error: null });

    await expect(getPublicRuntimeQuestV2(runtimeQuestId)).resolves.toMatchObject({
      missionIntro: null,
      missionOutro: null,
      tasks: [
        { narrativeIntro: null, narrativeSuccess: null },
        { narrativeIntro: null, narrativeSuccess: null },
        { narrativeIntro: null, narrativeSuccess: null },
      ],
    });
  });

  it("fails closed for fetch database failures and malformed rows", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: "private" } });
    await expect(getPublicRuntimeQuest(runtimeQuestId)).rejects.toThrow(
      "Public runtime fetch failed."
    );

    mocks.rpc.mockResolvedValueOnce({
      data: [malformedRuntimeQuestRow],
      error: null,
    });
    await expect(getPublicRuntimeQuest(runtimeQuestId)).rejects.toThrow(
      "Public runtime fetch returned invalid data."
    );

    const missingImageUrlRow = {
      ...publicRuntimeQuestRow,
      tasks: publicRuntimeQuestRow.tasks.map((task, index) => {
        if (index !== 0) return task;

        const taskWithoutImageUrl = { ...task };
        delete taskWithoutImageUrl.image_url;
        return taskWithoutImageUrl;
      }),
    };
    mocks.rpc.mockResolvedValueOnce({ data: [missingImageUrlRow], error: null });
    await expect(getPublicRuntimeQuest(runtimeQuestId)).rejects.toThrow(
      "Public runtime fetch returned invalid data."
    );

    const invalidImageUrlRow = {
      ...publicRuntimeQuestRow,
      tasks: publicRuntimeQuestRow.tasks.map((task, index) =>
        index === 0 ? { ...task, image_url: 1 } : task
      ),
    };
    mocks.rpc.mockResolvedValueOnce({ data: [invalidImageUrlRow], error: null });
    await expect(getPublicRuntimeQuest(runtimeQuestId)).rejects.toThrow(
      "Public runtime fetch returned invalid data."
    );
  });

  it("maps the allowlisted scoring DTO and validates aggregate counts", async () => {
    mocks.rpc.mockResolvedValue({ data: [publicRuntimeResultRow], error: null });

    await expect(
      scorePublicRuntimeQuest(runtimeQuestId, validSubmission)
    ).resolves.toEqual(publicRuntimeResult);
    expect(mocks.rpc).toHaveBeenCalledWith("score_public_runtime_quest", {
      p_quest_id: runtimeQuestId,
      p_answers: validSubmission,
    });
  });

  it("maps unanswered task results without exposing internal scoring fields", async () => {
    mocks.rpc.mockResolvedValue({
      data: [publicRuntimeResultWithUnansweredRow],
      error: null,
    });

    const result = await scorePublicRuntimeQuest(runtimeQuestId, validSubmission);

    expect(result).toEqual(publicRuntimeResultWithUnanswered);
    expect(result?.unansweredCount).toBe(1);
    expect(result?.taskResults).toContainEqual({
      taskId: publicRuntimeResultWithUnanswered.taskResults[3].taskId,
      status: "unanswered",
    });
    expect(JSON.stringify(result)).not.toContain("correctOptionId");
    expect(JSON.stringify(result)).not.toContain("answer_key");
    expect(JSON.stringify(result)).not.toContain("owner");
    expect(JSON.stringify(result)).not.toContain("content");
  });

  it("returns null for unavailable scoring and fails closed for bad results", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(
      scorePublicRuntimeQuest(runtimeQuestId, validSubmission)
    ).resolves.toBeNull();

    mocks.rpc.mockResolvedValueOnce({
      data: [malformedRuntimeResultRow],
      error: null,
    });
    await expect(
      scorePublicRuntimeQuest(runtimeQuestId, validSubmission)
    ).rejects.toThrow("Public runtime scoring returned invalid data.");
  });

  it("maps scoring RPC errors to the generic service error", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "synthetic database detail" },
    });

    const error = await scorePublicRuntimeQuest(runtimeQuestId, validSubmission).catch(
      (reason) => reason
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Public runtime scoring failed.");
    expect((error as Error).message).not.toContain("synthetic database detail");
  });

  it("rejects invalid ids and strict malformed submissions before any RPC call", async () => {
    await expect(getPublicRuntimeQuest("not-a-uuid")).rejects.toThrow(
      "Public runtime request is invalid."
    );
    await expect(
      scorePublicRuntimeQuest(runtimeQuestId, {
        answers: [{ taskId: runtimeQuestId, selectedOptionId: undefined }],
      } as never)
    ).rejects.toThrow("Public runtime submission is invalid.");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
