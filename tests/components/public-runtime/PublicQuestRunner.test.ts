import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PublicQuestRunner, {
  createPublicRuntimeSubmission,
  getInitialPublicQuestRunnerPhase,
  PublicQuestTransition,
  shouldShowPublicQuestTransition,
} from "@/components/public-runtime/PublicQuestRunner";
import type { PublicRuntimeQuestV2 } from "@/types/public-runtime";

const questId = "7c4cf0cf-42ef-4c1d-a696-8a0be0c2c8c8";
const firstTaskId = "d6db30c3-2d00-47d8-9a9c-2f879c8c36fe";
const secondTaskId = "3c4cf0cf-42ef-4c1d-a696-8a0be0c2c8c8";
const optionId = "4c4cf0cf-42ef-4c1d-a696-8a0be0c2c8c8";
const sequenceItemIds = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
];

function narrativeQuest(overrides: Partial<PublicRuntimeQuestV2> = {}): PublicRuntimeQuestV2 {
  return {
    id: questId,
    title: "Narrative quest",
    description: null,
    missionIntro: "Mission briefing",
    missionOutro: "Mission complete",
    tasks: [
      {
        id: firstTaskId,
        taskType: "text",
        title: "First task",
        description: null,
        imageUrl: null,
        narrativeIntro: "A scene before the first task.",
        narrativeSuccess: "A transition after the first task.",
      },
      {
        id: secondTaskId,
        taskType: "single_choice",
        title: "Second task",
        description: null,
        imageUrl: null,
        narrativeIntro: null,
        narrativeSuccess: null,
        options: [{ id: optionId, text: "Option" }, { id: "other", text: "Other" }],
      },
    ],
    ...overrides,
  };
}

describe("PublicQuestRunner narrative flow", () => {
  it("renders a mission screen before the first task when a mission intro exists", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicQuestRunner, { quest: narrativeQuest() })
    );

    expect(markup).toContain("Твоя миссия");
    expect(markup).toContain("Mission briefing");
    expect(markup).toContain("Начать миссию");
    expect(markup).not.toContain("First task");
  });

  it("keeps a quest without a mission intro on the backward-compatible task view", () => {
    const quest = narrativeQuest({ missionIntro: null });
    const markup = renderToStaticMarkup(
      createElement(PublicQuestRunner, { quest })
    );

    expect(getInitialPublicQuestRunnerPhase(quest)).toBe("active");
    expect(markup).toContain("First task");
    expect(markup).toContain("Сцена");
    expect(markup).toContain("A scene before the first task.");
    expect(markup).not.toContain("Твоя миссия");
  });

  it("uses a transition only for a non-final task with narrative success text", () => {
    const quest = narrativeQuest();

    expect(shouldShowPublicQuestTransition(quest.tasks[0], false)).toBe(true);
    expect(shouldShowPublicQuestTransition(quest.tasks[0], true)).toBe(false);
    expect(shouldShowPublicQuestTransition(quest.tasks[1], false)).toBe(false);
  });

  it("renders a neutral transition before the next task without correctness feedback", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicQuestTransition, {
        questTitle: "Narrative quest",
        narrativeSuccess: "A transition after the first task.",
        currentTaskIndex: 0,
        taskCount: 2,
        onContinue: () => undefined,
      })
    );

    expect(markup).toContain("A transition after the first task.");
    expect(markup).toContain("Продолжить путь");
    expect(markup).not.toContain("Верно");
  });

  it("constructs the same answer-only submission contract without narrative fields", () => {
    const quest = narrativeQuest();
    const submission = createPublicRuntimeSubmission(
      quest,
      { [secondTaskId]: optionId },
      {}
    );

    expect(submission).toEqual({
      answers: [
        { taskId: firstTaskId },
        { taskId: secondTaskId, selectedOptionId: optionId },
      ],
    });
    expect(JSON.stringify(submission)).not.toContain("narrative");
    expect(JSON.stringify(submission)).not.toContain("Mission");
  });

  it("keeps an untouched Sequence display unanswered and submits an explicitly moved order", () => {
    const sequenceTask = {
      id: "55555555-5555-4555-8555-555555555555",
      taskType: "sequence" as const,
      title: "Sequence task",
      description: null,
      imageUrl: null,
      narrativeIntro: null,
      narrativeSuccess: null,
      items: sequenceItemIds.map((id, index) => ({ id, text: `Item ${index + 1}` })),
    };
    const quest = narrativeQuest({ tasks: [...narrativeQuest().tasks, sequenceTask] });

    expect(createPublicRuntimeSubmission(quest, {}, {}, {})).toEqual({
      answers: [
        { taskId: firstTaskId },
        { taskId: secondTaskId },
        { taskId: sequenceTask.id },
      ],
    });
    expect(
      createPublicRuntimeSubmission(quest, {}, {}, {
        [sequenceTask.id]: [sequenceItemIds[1], sequenceItemIds[0], sequenceItemIds[2]],
      }).answers
    ).toContainEqual({
      taskId: sequenceTask.id,
      orderedItemIds: [sequenceItemIds[1], sequenceItemIds[0], sequenceItemIds[2]],
    });
  });
});
