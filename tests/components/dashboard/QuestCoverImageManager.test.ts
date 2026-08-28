import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/storage.service", () => ({
  removeQuestCoverImage: vi.fn(),
  uploadQuestCoverImage: vi.fn(),
}));

import QuestCoverImageManager from "@/components/dashboard/QuestCoverImageManager";

describe("QuestCoverImageManager", () => {
  it("keeps the current cover and replacement/delete controls available", () => {
    const markup = renderToStaticMarkup(
      createElement(QuestCoverImageManager, {
        questId: "11111111-1111-4111-8111-111111111111",
        initialCoverImageUrl: "https://example.test/current-cover.png",
      })
    );

    expect(markup).toContain('src="https://example.test/current-cover.png"');
    expect(markup).toContain("Заменить обложку");
    expect(markup).toContain("Удалить обложку");
    expect(markup).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(markup).toContain('class="sr-only"');
  });

  it("shows the upload action when no cover exists", () => {
    const markup = renderToStaticMarkup(
      createElement(QuestCoverImageManager, {
        questId: "11111111-1111-4111-8111-111111111111",
        initialCoverImageUrl: null,
      })
    );

    expect(markup).toContain("Загрузить обложку");
    expect(markup).toContain("Обложка не загружена");
    expect(markup).not.toContain("Удалить обложку");
  });
});
