import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import {
  listTeacherQuestAttemptSummaries,
  TeacherQuestResultsServiceError,
} from "@/services/teacher-quest-results.server";

const questId = "11111111-1111-4111-8111-111111111111";
const attemptId = "22222222-2222-4222-8222-222222222222";

function row(overrides: Record<string, unknown> = {}) {
  return {
    attempt_id: attemptId,
    student_display_name: "\u0423\u0447\u0435\u043d\u0438\u043a",
    submitted_at: "2026-08-19T03:01:00+00:00",
    earned_points: 70,
    possible_points: 125,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ data: [row()], error: null });
});

describe("listTeacherQuestAttemptSummaries", () => {
  it("calls only the narrow teacher-results RPC and maps a valid summary", async () => {
    await expect(listTeacherQuestAttemptSummaries(questId)).resolves.toEqual([
      {
        attemptId,
        studentDisplayName: "\u0423\u0447\u0435\u043d\u0438\u043a",
        submittedAt: "2026-08-19T03:01:00+00:00",
        earnedPoints: 70,
        possiblePoints: 125,
        percentage: 56,
      },
    ]);

    expect(mocks.rpc).toHaveBeenCalledWith("list_teacher_quest_attempts", {
      p_quest_id: questId,
      p_limit: 20,
      p_offset: 0,
    });
  });

  it("returns null percentage for zero possible points", async () => {
    mocks.rpc.mockResolvedValue({ data: [row({ earned_points: 0, possible_points: 0 })], error: null });

    await expect(listTeacherQuestAttemptSummaries(questId)).resolves.toEqual([
      expect.objectContaining({ percentage: null }),
    ]);
  });

  it("normalizes pagination before passing it to the RPC", async () => {
    await listTeacherQuestAttemptSummaries(questId, { limit: 100, offset: -4 });

    expect(mocks.rpc).toHaveBeenCalledWith("list_teacher_quest_attempts", {
      p_quest_id: questId,
      p_limit: 50,
      p_offset: 0,
    });
  });

  it("fails safely for malformed RPC data or provider errors", async () => {
    mocks.rpc.mockResolvedValue({ data: [row({ student_display_name: "" })], error: null });
    await expect(listTeacherQuestAttemptSummaries(questId)).rejects.toBeInstanceOf(
      TeacherQuestResultsServiceError
    );

    mocks.rpc.mockResolvedValue({ data: null, error: { message: "private error" } });
    await expect(listTeacherQuestAttemptSummaries(questId)).rejects.toBeInstanceOf(
      TeacherQuestResultsServiceError
    );
  });

  it("does not query for malformed quest IDs", async () => {
    await expect(listTeacherQuestAttemptSummaries("not-a-uuid")).resolves.toEqual([]);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
