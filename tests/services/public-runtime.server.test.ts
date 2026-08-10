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
  scorePublicRuntimeQuest,
} from "@/services/public-runtime.server";

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
        })),
        {
          id: publicRuntimeQuestRow.tasks[4].id,
          taskType: "single_choice",
          title: publicRuntimeQuestRow.tasks[4].title,
          description: publicRuntimeQuestRow.tasks[4].description,
          options: publicRuntimeQuestRow.tasks[4].options.map((option) => ({
            id: option.id,
            text: option.text,
          })),
        },
        {
          id: publicRuntimeQuestRow.tasks[5].id,
          taskType: "single_choice",
          title: publicRuntimeQuestRow.tasks[5].title,
          description: publicRuntimeQuestRow.tasks[5].description,
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
  });

  it("returns null for an unavailable runtime quest", async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });

    await expect(getPublicRuntimeQuest(runtimeQuestId)).resolves.toBeNull();
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
