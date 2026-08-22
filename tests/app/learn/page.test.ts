import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listPublicCatalogQuests: vi.fn(),
  listStudentAttemptHistory: vi.fn(),
  history: vi.fn(() => null),
}));

vi.mock("@/services/public-catalog.server", () => ({
  listPublicCatalogQuests: mocks.listPublicCatalogQuests,
}));

vi.mock("@/components/catalog/PublicCatalogResults", () => ({
  default: () => null,
}));
vi.mock("@/services/student-attempt-history.server", () => ({
  listStudentAttemptHistory: mocks.listStudentAttemptHistory,
}));
vi.mock("@/components/learn/LearnerAttemptHistory", () => ({
  default: mocks.history,
}));

import LearnPage from "@/app/learn/page";

const result = {
  quests: [],
  hasNext: false,
  offset: 0,
  pageSize: 24,
};

async function renderLearnPage(searchParams: Record<string, string | undefined>) {
  mocks.listPublicCatalogQuests.mockResolvedValue(result);
  mocks.listStudentAttemptHistory.mockResolvedValue({
    items: [{ questTitle: "Snapshot history title" }],
    hasMore: false,
    nextOffset: null,
  });

  const page = await LearnPage({ searchParams: Promise.resolve(searchParams) });
  const children = page.props.children.props.children;

  return Array.isArray(children) ? children : [children];
}

describe("learn page catalog pagination", () => {
  it("requests the offset from /learn pagination links and keeps the learner base path", async () => {
    const children = await renderLearnPage({ offset: "24" });
    const results = children[1];
    const history = children[2];

    expect(mocks.listPublicCatalogQuests).toHaveBeenCalledWith({
      search: null,
      subject: null,
      grade: null,
      difficulty: null,
      offset: 24,
    });
    expect(results.props.basePath).toBe("/learn");
    expect(results.props.query.offset).toBe(24);
    expect(results.props.questHref("quest-id")).toBe("/learn/quests/quest-id/start");
    expect(results.props.disableQuestPrefetch).toBe(true);
    expect(mocks.listStudentAttemptHistory).toHaveBeenCalledWith();
    expect(history.type).toBe(mocks.history);
    expect(history.props.history.items[0].questTitle).toBe("Snapshot history title");
  });

  it.each([undefined, "-1", "1.5", "not-a-number"]) (
    "uses offset zero for the default or invalid learner offset %s",
    async (offset) => {
      await renderLearnPage(offset === undefined ? {} : { offset });

      expect(mocks.listPublicCatalogQuests).toHaveBeenLastCalledWith(
        expect.objectContaining({ offset: 0 })
      );
    }
  );

  it("keeps the catalog available and passes an unavailable history state through safely", async () => {
    mocks.listPublicCatalogQuests.mockResolvedValue(result);
    mocks.listStudentAttemptHistory.mockRejectedValue(new Error("private detail"));

    const page = await LearnPage({ searchParams: Promise.resolve({}) });
    const children = page.props.children.props.children as React.ReactElement[];

    expect(mocks.listPublicCatalogQuests).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 0 })
    );
    expect(children[1].type).not.toBe(mocks.history);
    expect(children[2].type).toBe(mocks.history);
    expect(children[2].props.history).toBeNull();
  });
});
