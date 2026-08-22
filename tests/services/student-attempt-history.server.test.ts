import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  from: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import {
  getStudentAttemptHistoryDetail,
  listStudentAttemptHistory,
  StudentAttemptHistoryServiceError,
} from "@/services/student-attempt-history.server";

const attemptId = "b5f1f56a-6014-4d33-8c49-87b10a78f76e";
const laterAttemptId = "c5f1f56a-6014-4d33-8c49-87b10a78f76e";
const questId = "7c4cf0cf-42ef-4c1d-a696-8a0be0c2c8c8";
const textTaskId = "d6db30c3-2d00-47d8-9a9c-2f879c8c36fe";
const choiceTaskId = "e6db30c3-2d00-47d8-9a9c-2f879c8c36fe";
const optionOneId = "f6db30c3-2d00-47d8-9a9c-2f879c8c36fe";
const optionTwoId = "a7db30c3-2d00-47d8-9a9c-2f879c8c36fe";

function summary(overrides: Record<string, unknown> = {}) {
  return {
    id: attemptId,
    quest_id: questId,
    started_at: "2026-08-18T00:00:00+00:00",
    submitted_at: "2026-08-18T00:05:00+00:00",
    quest_title_snapshot: "Snapshot quest title",
    earned_points: 5,
    possible_points: 8,
    correct_count: 1,
    incorrect_count: 1,
    unanswered_count: 0,
    not_scored_count: 1,
    ...overrides,
  };
}

const taskRows = [
  {
    source_task_id: textTaskId,
    task_order: 1,
    task_type: "text",
    task_snapshot: {
      id: textTaskId,
      task_type: "text",
      title: "Snapshot text task",
      description: null,
      image_url: null,
    },
    answer_snapshot: {},
    status: "not_scored",
    earned_points: 0,
    possible_points: 0,
  },
  {
    source_task_id: choiceTaskId,
    task_order: 2,
    task_type: "single_choice",
    task_snapshot: {
      id: choiceTaskId,
      task_type: "single_choice",
      title: "Snapshot choice task",
      description: "Saved task description",
      image_url: "https://example.supabase.co/task.png",
      options: [
        { id: optionOneId, text: "Saved option one" },
        { id: optionTwoId, text: "Saved option two" },
      ],
    },
    answer_snapshot: { selectedOptionId: optionOneId },
    status: "correct",
    earned_points: 5,
    possible_points: 8,
  },
  {
    source_task_id: "b7db30c3-2d00-47d8-9a9c-2f879c8c36fe",
    task_order: 3,
    task_type: "multiple_choice",
    task_snapshot: {
      id: "b7db30c3-2d00-47d8-9a9c-2f879c8c36fe",
      task_type: "multiple_choice",
      title: "Another snapshot task",
      description: null,
      image_url: null,
      options: [
        { id: "c7db30c3-2d00-47d8-9a9c-2f879c8c36fe", text: "One" },
        { id: "d7db30c3-2d00-47d8-9a9c-2f879c8c36fe", text: "Two" },
      ],
    },
    answer_snapshot: { selectedOptionIds: [] },
    status: "incorrect",
    earned_points: 0,
    possible_points: 0,
  },
];

function listBuilder(response: unknown) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.range.mockResolvedValue(response);
  return builder;
}

function submittedOnlyListBuilder(rows: Array<Record<string, unknown>>) {
  let status: string | null = null;
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockImplementation((column: string, value: string) => {
    if (column === "status") status = value;
    return builder;
  });
  builder.order.mockReturnValue(builder);
  builder.range.mockImplementation(async (from: number, to: number) => ({
    data: rows
      .filter((row) => row.status === status)
      .slice(from, to + 1)
      .map((row) => Object.fromEntries(
        Object.entries(row).filter(([key]) => key !== "status")
      )),
    error: null,
  }));
  return builder;
}

function detailBuilder(response: unknown) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.maybeSingle.mockResolvedValue(response);
  return builder;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({ from: mocks.from });
});

describe("student attempt history server service", () => {
  it("lists only submitted rows through RLS with deterministic bounded ordering", async () => {
    const builder = listBuilder({
      data: [summary({ id: laterAttemptId, submitted_at: "2026-08-19T00:05:00+00:00" }), summary()],
      error: null,
    });
    mocks.from.mockReturnValue(builder);

    await expect(listStudentAttemptHistory({ offset: 20 })).resolves.toEqual({
      items: [
        expect.objectContaining({ attemptId: laterAttemptId }),
        expect.objectContaining({ attemptId }),
      ],
      hasMore: false,
      nextOffset: null,
    });
    expect(mocks.from).toHaveBeenCalledWith("quest_attempts");
    expect(builder.eq).toHaveBeenCalledWith("status", "submitted");
    expect(builder.order).toHaveBeenNthCalledWith(1, "submitted_at", { ascending: false });
    expect(builder.order).toHaveBeenNthCalledWith(2, "id", { ascending: false });
    expect(builder.range).toHaveBeenCalledWith(20, 40);
  });

  it("caps pagination and fails closed for malformed summary rows", async () => {
    const builder = listBuilder({ data: [summary({ quest_title_snapshot: null })], error: null });
    mocks.from.mockReturnValue(builder);

    await expect(listStudentAttemptHistory({ offset: -1 })).rejects.toBeInstanceOf(
      StudentAttemptHistoryServiceError
    );
    expect(builder.range).toHaveBeenCalledWith(0, 20);
  });

  it("uses the 20 plus one contract and returns only submitted attempts", async () => {
    const submittedRows = Array.from({ length: 21 }, (_, index) =>
      summary({
        id: `00000000-0000-4000-8000-${String(21 - index).padStart(12, "0")}`,
        submitted_at: `2026-08-${String(21 - index).padStart(2, "0")}T00:05:00+00:00`,
        status: "submitted",
      })
    );
    const builder = submittedOnlyListBuilder([
      ...submittedRows,
      summary({ id: "10000000-0000-4000-8000-000000000001", status: "started" }),
      summary({ id: "20000000-0000-4000-8000-000000000001", status: "abandoned" }),
    ]);
    mocks.from.mockReturnValue(builder);

    const result = await listStudentAttemptHistory();

    expect(result.items).toHaveLength(20);
    expect(result.items[0]?.attemptId).toBe("00000000-0000-4000-8000-000000000021");
    expect(result.items[19]?.attemptId).toBe("00000000-0000-4000-8000-000000000002");
    expect(result.items.map((item) => item.attemptId)).not.toContain(
      "10000000-0000-4000-8000-000000000001"
    );
    expect(result.items.map((item) => item.attemptId)).not.toContain(
      "20000000-0000-4000-8000-000000000001"
    );
    expect(result.hasMore).toBe(true);
    expect(result.nextOffset).toBe(20);
    expect(builder.eq).toHaveBeenCalledWith("status", "submitted");
    expect(builder.range).toHaveBeenCalledWith(0, 20);
  });

  it("maps an owned submitted snapshot detail without reading current quest data", async () => {
    const attemptBuilder = detailBuilder({ data: summary(), error: null });
    const answersBuilder = listBuilder({ data: taskRows, error: null });
    answersBuilder.order.mockResolvedValue({ data: taskRows, error: null });
    mocks.from.mockReturnValueOnce(attemptBuilder).mockReturnValueOnce(answersBuilder);

    const detail = await getStudentAttemptHistoryDetail(attemptId);

    expect(detail).toMatchObject({ attemptId, questTitle: "Snapshot quest title" });
    expect(detail?.tasks[0]).toMatchObject({
      taskOrder: 1,
      taskType: "text",
      status: "not_scored",
    });
    expect(detail?.tasks[1]).toMatchObject({
      taskOrder: 2,
      taskType: "single_choice",
      selectedOptionId: optionOneId,
    });
    expect(JSON.stringify(detail)).not.toContain("correctOptionId");
    expect(mocks.from).toHaveBeenNthCalledWith(1, "quest_attempts");
    expect(mocks.from).toHaveBeenNthCalledWith(2, "quest_attempt_answers");
    expect(answersBuilder.order).toHaveBeenCalledWith("task_order", { ascending: true });
  });

  it("returns generic unavailable for malformed, missing, or foreign attempt IDs", async () => {
    await expect(getStudentAttemptHistoryDetail("not-a-uuid")).resolves.toBeNull();

    const builder = detailBuilder({ data: null, error: null });
    mocks.from.mockReturnValue(builder);
    await expect(getStudentAttemptHistoryDetail(attemptId)).resolves.toBeNull();
  });

  it("fails closed for snapshots with correctness fields or malformed learner answers", async () => {
    const attemptBuilder = detailBuilder({ data: summary(), error: null });
    const malformedTasks = structuredClone(taskRows);
    malformedTasks[1].task_snapshot.correctOptionId = optionOneId;
    const answersBuilder = listBuilder({ data: malformedTasks, error: null });
    answersBuilder.order.mockResolvedValue({ data: malformedTasks, error: null });
    mocks.from.mockReturnValueOnce(attemptBuilder).mockReturnValueOnce(answersBuilder);

    await expect(getStudentAttemptHistoryDetail(attemptId)).rejects.toBeInstanceOf(
      StudentAttemptHistoryServiceError
    );

    const answerAttemptBuilder = detailBuilder({ data: summary(), error: null });
    const malformedAnswers = structuredClone(taskRows);
    malformedAnswers[1].answer_snapshot.selectedOptionId = "not-a-snapshotted-option";
    const answerBuilder = listBuilder({ data: malformedAnswers, error: null });
    answerBuilder.order.mockResolvedValue({ data: malformedAnswers, error: null });
    mocks.from.mockReturnValueOnce(answerAttemptBuilder).mockReturnValueOnce(answerBuilder);

    await expect(getStudentAttemptHistoryDetail(attemptId)).rejects.toBeInstanceOf(
      StudentAttemptHistoryServiceError
    );
  });
});
