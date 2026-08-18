import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import TeacherQuestResultsList from "@/components/dashboard/TeacherQuestResultsList";
import type { TeacherQuestAttemptSummary } from "@/types/teacher-quest-results";

const attempts: TeacherQuestAttemptSummary[] = [
  {
    attemptId: "11111111-1111-4111-8111-111111111111",
    studentDisplayName: "\u0423\u0447\u0435\u043d\u0438\u043a",
    submittedAt: "2026-08-19T03:01:00+00:00",
    earnedPoints: 70,
    possiblePoints: 125,
    percentage: 56,
  },
  {
    attemptId: "22222222-2222-4222-8222-222222222222",
    studentDisplayName: "\u0423\u0447\u0435\u043d\u0438\u043a",
    submittedAt: "2026-08-18T03:01:00+00:00",
    earnedPoints: 60,
    possiblePoints: 125,
    percentage: 48,
  },
];

describe("TeacherQuestResultsList", () => {
  it("renders supplied teacher result summaries without a future detail link", () => {
    const markup = renderToStaticMarkup(
      createElement(TeacherQuestResultsList, { attempts })
    );

    expect(markup).toContain("\u0423\u0447\u0435\u043d\u0438\u043a");
    expect(markup).toContain("70 / 125");
    expect(markup).toContain("60 / 125");
    expect(markup).toContain("56%");
    expect(markup).toContain("48%");
    expect(markup).not.toContain("/results/11111111-1111-4111-8111-111111111111");
  });

  it("uses a safe empty state and handles zero-score totals", () => {
    const emptyMarkup = renderToStaticMarkup(
      createElement(TeacherQuestResultsList, { attempts: [] })
    );
    const zeroMarkup = renderToStaticMarkup(
      createElement(TeacherQuestResultsList, {
        attempts: [{ ...attempts[0], possiblePoints: 0, percentage: null }],
      })
    );

    expect(emptyMarkup).toContain("\u042d\u0442\u043e\u0442 \u043a\u0432\u0435\u0441\u0442 \u043f\u043e\u043a\u0430 \u043d\u0438\u043a\u0442\u043e \u043d\u0435 \u043f\u0440\u043e\u0448\u0451\u043b.");
    expect(zeroMarkup).toContain("\u2014");
  });

  it("renders a generic unavailable state without provider details", () => {
    const markup = renderToStaticMarkup(
      createElement(TeacherQuestResultsList, { attempts: null })
    );

    expect(markup).toContain("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b.");
    expect(markup).not.toContain("private error");
  });
});
