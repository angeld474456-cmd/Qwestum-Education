import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPublicRuntimeQuestV2: vi.fn(),
  runner: vi.fn(() => null),
}));

vi.mock("@/components/public-runtime/PublicQuestRunner", () => ({
  default: mocks.runner,
}));
vi.mock("@/services/public-runtime.server", () => ({
  getPublicRuntimeQuestV2: mocks.getPublicRuntimeQuestV2,
}));

import PublicQuestStartPage from "@/app/catalog/[id]/start/page";

const questId = "7c4cf0cf-42ef-4c1d-a696-8a0be0c2c8c8";
const quest = {
  id: questId,
  title: "Quest",
  description: null,
  missionIntro: "Mission briefing",
  missionOutro: null,
  tasks: [
    {
      id: "d6db30c3-2d00-47d8-9a9c-2f879c8c36fe",
      taskType: "text" as const,
      title: "Task",
      description: null,
      imageUrl: null,
      narrativeIntro: null,
      narrativeSuccess: null,
    },
  ],
};

describe("public quest start page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads the strict narrative runtime DTO for the browser runner", async () => {
    mocks.getPublicRuntimeQuestV2.mockResolvedValue(quest);

    const page = await PublicQuestStartPage({
      params: Promise.resolve({ id: questId }),
    });
    const runner = page.props.children;

    expect(mocks.getPublicRuntimeQuestV2).toHaveBeenCalledWith(questId);
    expect(runner.type).toBe(mocks.runner);
    expect(runner.props.quest).toBe(quest);
  });

  it("keeps invalid ids away from the runtime loader", async () => {
    await PublicQuestStartPage({
      params: Promise.resolve({ id: "not-a-uuid" }),
    });

    expect(mocks.getPublicRuntimeQuestV2).not.toHaveBeenCalled();
  });
});
