import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) =>
    createElement("a", props, children),
}));
vi.mock("@/components/public-runtime/PublicTaskImage", () => ({ default: () => null }));

import LearnerAttemptResult from "@/components/learn/LearnerAttemptResult";
import type { StudentAttemptHistoryDetail } from "@/types/student-attempt-history";

const attempt: StudentAttemptHistoryDetail = {
  attemptId: "b5f1f56a-6014-4d33-8c49-87b10a78f76e",
  questId: "7c4cf0cf-42ef-4c1d-a696-8a0be0c2c8c8",
  questTitle: "Historical title",
  earnedPoints: 5,
  possiblePoints: 8,
  correctCount: 1,
  incorrectCount: 0,
  unansweredCount: 0,
  notScoredCount: 1,
  startedAt: "2026-08-18T00:00:00+00:00",
  submittedAt: "2026-08-18T00:05:00+00:00",
  tasks: [
    {
      sourceTaskId: "d6db30c3-2d00-47d8-9a9c-2f879c8c36fe",
      taskOrder: 1,
      taskType: "single_choice",
      title: "Historical task",
      description: "Historical description",
      imageUrl: null,
      options: [
        { id: "one", text: "Chosen option" },
        { id: "two", text: "Other option" },
      ],
      selectedOptionId: "one",
      status: "correct",
      earnedPoints: 5,
      possiblePoints: 8,
    },
  ],
};

describe("LearnerAttemptResult", () => {
  it("renders only immutable snapshots and links to a fresh learner start", () => {
    const markup = renderToStaticMarkup(createElement(LearnerAttemptResult, { attempt }));

    expect(markup).toContain("Historical title");
    expect(markup).toContain("Historical task");
    expect(markup).toContain("Chosen option");
    expect(markup).toContain("Ваш выбор");
    expect(markup).toContain(`href="/learn/quests/${attempt.questId}/start"`);
    expect(markup).toContain('href="/learn"');
    expect(markup).not.toContain("correctOptionId");
    expect(markup).not.toContain("correctOptionIds");
  });
});
