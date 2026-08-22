import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import {
  startStudentQuestAttempt,
  StudentAttemptServiceError,
  submitStudentQuestAttempt,
} from "@/services/student-attempt.server";

const attemptId = "b5f1f56a-6014-4d33-8c49-87b10a78f76e";
const questId = "7c4cf0cf-42ef-4c1d-a696-8a0be0c2c8c8";
const taskId = "d6db30c3-2d00-47d8-9a9c-2f879c8c36fe";
const submission = { answers: [{ taskId, selectedOptionId: "option-one" }] };

const resultRow = {
  attempt_id: attemptId,
  earned_points: 3,
  possible_points: 5,
  correct_count: 1,
  incorrect_count: 0,
  unanswered_count: 0,
  not_scored_count: 0,
  task_results: [{ taskId, status: "correct" }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
});

describe("student attempt server service", () => {
  it("starts an attempt through the exact M044 RPC and maps its DTO", async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        {
          attempt_id: attemptId,
          quest_id: questId,
          status: "started",
          started_at: "2026-08-18T00:00:00+00:00",
        },
      ],
      error: null,
    });

    await expect(startStudentQuestAttempt(questId)).resolves.toEqual({
      attemptId,
      questId,
      status: "started",
      startedAt: "2026-08-18T00:00:00+00:00",
    });
    expect(mocks.rpc).toHaveBeenCalledWith("start_student_quest_attempt", {
      p_quest_id: questId,
    });
  });

  it("fails closed for unavailable, multiple, malformed, and failed start responses", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(startStudentQuestAttempt(questId)).resolves.toBeNull();

    mocks.rpc.mockResolvedValueOnce({ data: [{}, {}], error: null });
    await expect(startStudentQuestAttempt(questId)).rejects.toBeInstanceOf(StudentAttemptServiceError);

    mocks.rpc.mockResolvedValueOnce({ data: [{ attempt_id: attemptId }], error: null });
    await expect(startStudentQuestAttempt(questId)).rejects.toBeInstanceOf(StudentAttemptServiceError);

    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: "private detail" } });
    await expect(startStudentQuestAttempt(questId)).rejects.toBeInstanceOf(StudentAttemptServiceError);
  });

  it("submits through the exact M044 RPC and maps only a valid public result", async () => {
    mocks.rpc.mockResolvedValue({ data: [resultRow], error: null });

    await expect(submitStudentQuestAttempt(attemptId, submission)).resolves.toEqual({
      attemptId,
      result: {
        earnedPoints: 3,
        possiblePoints: 5,
        correctCount: 1,
        incorrectCount: 0,
        unansweredCount: 0,
        notScoredCount: 0,
        taskResults: [{ taskId, status: "correct" }],
      },
    });
    expect(mocks.rpc).toHaveBeenCalledWith("submit_student_quest_attempt", {
      p_attempt_id: attemptId,
      p_answers: submission,
    });
  });

  it("fails closed for zero, multiple, and malformed submit responses", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(submitStudentQuestAttempt(attemptId, submission)).resolves.toBeNull();

    mocks.rpc.mockResolvedValueOnce({ data: [resultRow, resultRow], error: null });
    await expect(submitStudentQuestAttempt(attemptId, submission)).rejects.toBeInstanceOf(StudentAttemptServiceError);

    mocks.rpc.mockResolvedValueOnce({
      data: [{ ...resultRow, earned_points: 6 }],
      error: null,
    });
    await expect(submitStudentQuestAttempt(attemptId, submission)).rejects.toBeInstanceOf(StudentAttemptServiceError);

    mocks.rpc.mockResolvedValueOnce({
      data: [
        {
          ...resultRow,
          task_results: Array.from({ length: 101 }, (_, index) => ({
            taskId: `${String(index).padStart(8, "0")}-42ef-4c1d-a696-8a0be0c2c8c8`,
            status: "unanswered",
          })),
          correct_count: 0,
          unanswered_count: 101,
        },
      ],
      error: null,
    });
    await expect(submitStudentQuestAttempt(attemptId, submission)).rejects.toBeInstanceOf(StudentAttemptServiceError);
  });
});
