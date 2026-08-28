import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import PublicTaskRenderer from "@/components/public-runtime/PublicTaskRenderer";

const sequenceTask = {
  id: "55555555-5555-4555-8555-555555555555",
  taskType: "sequence" as const,
  title: "Sequence task",
  description: null,
  imageUrl: null,
  items: [
    { id: "11111111-1111-4111-8111-111111111111", text: "First" },
    { id: "22222222-2222-4222-8222-222222222222", text: "Second" },
    { id: "33333333-3333-4333-8333-333333333333", text: "Third" },
  ],
};

describe("PublicTaskRenderer", () => {
  it("dispatches Sequence explicitly without receiving canonical data", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicTaskRenderer, {
        task: sequenceTask,
        disabled: false,
        onSelectOption: vi.fn(),
        onToggleOption: vi.fn(),
        onSequenceChange: vi.fn(),
      })
    );

    expect(markup).toContain("Sequence task");
    expect(markup).toContain("First");
    expect(markup).not.toContain("correctOrder");
  });

  it("keeps unknown task types fail-closed", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicTaskRenderer, {
        task: { ...sequenceTask, taskType: "unknown" } as never,
        disabled: false,
        onSelectOption: vi.fn(),
        onToggleOption: vi.fn(),
        onSequenceChange: vi.fn(),
      })
    );

    expect(markup).toContain("Неподдерживаемый тип задания.");
  });
});
