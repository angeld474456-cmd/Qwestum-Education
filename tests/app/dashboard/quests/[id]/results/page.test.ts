import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOwnedQuest: vi.fn(),
  listTeacherQuestAttemptSummaries: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: vi.fn() }));
vi.mock("@/services/teacher-quest.server", () => ({ getOwnedQuest: mocks.getOwnedQuest }));
vi.mock("@/services/teacher-quest-results.server", async () => {
  class TeacherQuestResultsServiceError extends Error {}
  return {
    listTeacherQuestAttemptSummaries: mocks.listTeacherQuestAttemptSummaries,
    TeacherQuestResultsServiceError,
  };
});

import TeacherQuestResultsPage from "@/app/dashboard/quests/[id]/results/page";

const questId = "11111111-1111-4111-8111-111111111111";

describe("TeacherQuestResultsPage", () => {
  it("loads teacher-owned quest context and the initial results page", async () => {
    mocks.getOwnedQuest.mockResolvedValue({ id: questId, title: "\u0422\u0430\u0439\u043d\u0430" });
    mocks.listTeacherQuestAttemptSummaries.mockResolvedValue([]);

    const page = await TeacherQuestResultsPage({ params: Promise.resolve({ id: questId }) });
    const children = page.props.children;

    expect(mocks.getOwnedQuest).toHaveBeenCalledWith(questId);
    expect(mocks.listTeacherQuestAttemptSummaries).toHaveBeenCalledWith(questId, {
      limit: 20,
      offset: 0,
    });
    expect(children[0].props.children[0].props.children[1].props.children).toBe("\u0422\u0430\u0439\u043d\u0430");
    expect(children[0].props.children[1].props.active).toBe("results");
  });
});
