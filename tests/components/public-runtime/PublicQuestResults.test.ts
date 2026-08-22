import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) =>
    createElement("a", { ...props, "data-next-link": "true" }, children),
}));

import PublicQuestResults from "@/components/public-runtime/PublicQuestResults";
import type {
  PublicRuntimeQuest,
  PublicRuntimeResult,
} from "@/types/public-runtime";

const questId = "7c4cf0cf-42ef-4c1d-a696-8a0be0c2c8c8";
const taskId = "d6db30c3-2d00-47d8-9a9c-2f879c8c36fe";

const quest: PublicRuntimeQuest = {
  id: questId,
  title: "Quest",
  description: null,
  tasks: [
    {
      id: taskId,
      taskType: "text",
      title: "Task",
      description: null,
      imageUrl: null,
    },
  ],
};

const result: PublicRuntimeResult = {
  earnedPoints: 0,
  possiblePoints: 0,
  correctCount: 0,
  incorrectCount: 0,
  unansweredCount: 0,
  notScoredCount: 1,
  taskResults: [{ taskId, status: "not_scored" }],
};

describe("PublicQuestResults", () => {
  it("navigates learner retry to a fresh learner attempt lifecycle", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicQuestResults, {
        quest,
        result,
        onRetry: vi.fn(),
        retryHref: `/learn/quests/${questId}/start`,
        catalogHref: "/learn",
      })
    );

    expect(markup).toContain(`<a href="/learn/quests/${questId}/start"`);
    expect(markup).not.toContain(
      `data-next-link="true" href="/learn/quests/${questId}/start"`
    );
    expect(markup).toContain('href="/learn"');
    expect(markup).not.toContain(`href="/catalog/${questId}"`);
    expect(markup).not.toContain("<button");
  });

  it("preserves anonymous retry and catalog defaults", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicQuestResults, { quest, result, onRetry: vi.fn() })
    );

    expect(markup).toContain("<button");
    expect(markup).toContain(`href="/catalog/${questId}"`);
    expect(markup).toContain('href="/catalog"');
  });

  it("renders an optional mission conclusion without replacing measured results", () => {
    const narrativeQuest = {
      ...quest,
      missionIntro: null,
      missionOutro: "Mission complete.",
      tasks: quest.tasks.map((task) => ({
        ...task,
        narrativeIntro: null,
        narrativeSuccess: null,
      })),
    };
    const markup = renderToStaticMarkup(
      createElement(PublicQuestResults, {
        quest: narrativeQuest,
        result,
        onRetry: vi.fn(),
      })
    );

    expect(markup).toContain("Миссия завершена");
    expect(markup).toContain("Mission complete.");
    expect(markup).toContain("Не оценивается");
  });
});
