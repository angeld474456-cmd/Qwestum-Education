import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listPublicCatalogQuests: vi.fn(),
}));

vi.mock("@/services/public-catalog.server", () => ({
  listPublicCatalogQuests: mocks.listPublicCatalogQuests,
}));

vi.mock("@/components/catalog/PublicCatalogResults", () => ({
  default: () => null,
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

  const page = await LearnPage({ searchParams: Promise.resolve(searchParams) });
  const children = page.props.children.props.children;

  return Array.isArray(children) ? children[1] : children;
}

describe("learn page catalog pagination", () => {
  it("requests the offset from /learn pagination links and keeps the learner base path", async () => {
    const results = await renderLearnPage({ offset: "24" });

    expect(mocks.listPublicCatalogQuests).toHaveBeenCalledWith({
      search: null,
      subject: null,
      grade: null,
      difficulty: null,
      offset: 24,
    });
    expect(results.props.basePath).toBe("/learn");
    expect(results.props.query.offset).toBe(24);
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
});
