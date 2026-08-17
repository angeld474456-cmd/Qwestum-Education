import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPublicRuntimeQuest: vi.fn(),
  startStudentQuestAttempt: vi.fn(),
  runner: vi.fn(() => null),
}));

vi.mock("@/components/public-runtime/PublicQuestRunner", () => ({
  default: mocks.runner,
}));
vi.mock("@/services/public-runtime.server", () => ({
  getPublicRuntimeQuest: mocks.getPublicRuntimeQuest,
}));
vi.mock("@/services/student-attempt.server", () => ({
  startStudentQuestAttempt: mocks.startStudentQuestAttempt,
  StudentAttemptServiceError: class StudentAttemptServiceError extends Error {},
}));

import LearnerQuestStartPage from "@/app/learn/quests/[id]/start/page";

const questId = "7c4cf0cf-42ef-4c1d-a696-8a0be0c2c8c8";
const attemptId = "b5f1f56a-6014-4d33-8c49-87b10a78f76e";
const quest = {
  id: questId,
  title: "Quest",
  description: null,
  tasks: [{ id: "d6db30c3-2d00-47d8-9a9c-2f879c8c36fe", taskType: "text" as const, title: "Task", description: null, imageUrl: null }],
};

function pageFor(id: string) {
  return LearnerQuestStartPage({ params: Promise.resolve({ id }) });
}

beforeEach(() => vi.clearAllMocks());

describe("learner quest start page", () => {
  it("composes the sanitized runtime quest with the persisted attempt configuration", async () => {
    mocks.getPublicRuntimeQuest.mockResolvedValue(quest);
    mocks.startStudentQuestAttempt.mockResolvedValue({
      attemptId,
      questId,
      status: "started",
      startedAt: "2026-08-18T00:00:00+00:00",
    });

    const page = await pageFor(questId);
    const runner = page.props.children;

    expect(mocks.getPublicRuntimeQuest).toHaveBeenCalledWith(questId);
    expect(mocks.startStudentQuestAttempt).toHaveBeenCalledWith(questId);
    expect(runner.type).toBe(mocks.runner);
    expect(runner.props).toEqual({
      quest,
      submitUrl: `/api/learn/attempts/${attemptId}/submit`,
      retryHref: `/learn/quests/${questId}/start`,
      catalogHref: "/learn",
    });
    expect(JSON.stringify(runner.props)).not.toContain("studentId");
  });

  it("renders the unavailable boundary without attempting persistence for invalid or unavailable quests", async () => {
    await pageFor("not-a-uuid");
    expect(mocks.getPublicRuntimeQuest).not.toHaveBeenCalled();
    expect(mocks.startStudentQuestAttempt).not.toHaveBeenCalled();

    mocks.getPublicRuntimeQuest.mockResolvedValue(null);
    await pageFor(questId);
    expect(mocks.startStudentQuestAttempt).not.toHaveBeenCalled();

    mocks.getPublicRuntimeQuest.mockResolvedValue(quest);
    mocks.startStudentQuestAttempt.mockResolvedValue(null);
    await pageFor(questId);
    expect(mocks.startStudentQuestAttempt).toHaveBeenCalledWith(questId);
  });
});
