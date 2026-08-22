import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) =>
    createElement("a", props, children),
}));

import LearnerAttemptHistory from "@/components/learn/LearnerAttemptHistory";
import type { StudentAttemptHistoryResult } from "@/types/student-attempt-history";

const history: StudentAttemptHistoryResult = {
  items: [
    {
      attemptId: "b5f1f56a-6014-4d33-8c49-87b10a78f76e",
      questId: "7c4cf0cf-42ef-4c1d-a696-8a0be0c2c8c8",
      questTitle: "Snapshot title",
      earnedPoints: 70,
      possiblePoints: 125,
      correctCount: 7,
      incorrectCount: 2,
      unansweredCount: 1,
      notScoredCount: 0,
      startedAt: "2026-08-18T00:00:00+00:00",
      submittedAt: "2026-08-18T00:05:00+00:00",
    },
  ],
  hasMore: false,
  nextOffset: null,
};

describe("LearnerAttemptHistory", () => {
  it("keeps the heading visible and renders submitted history entries", () => {
    const markup = renderToStaticMarkup(
      createElement(LearnerAttemptHistory, { history })
    );

    expect(markup).toContain("Мои результаты");
    expect(markup).toContain("Snapshot title");
    expect(markup).toContain("70 / 125");
  });

  it("shows a distinct successful empty state", () => {
    const markup = renderToStaticMarkup(
      createElement(LearnerAttemptHistory, {
        history: { items: [], hasMore: false, nextOffset: null },
      })
    );

    expect(markup).toContain("Мои результаты");
    expect(markup).toContain("У вас пока нет завершённых прохождений.");
  });

  it("shows a generic unavailable state without an error detail", () => {
    const markup = renderToStaticMarkup(
      createElement(LearnerAttemptHistory, { history: null })
    );

    expect(markup).toContain("Мои результаты");
    expect(markup).toContain("Не удалось загрузить историю результатов.");
    expect(markup).not.toContain("private detail");
  });
});
