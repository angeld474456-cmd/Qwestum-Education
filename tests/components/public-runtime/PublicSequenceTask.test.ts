import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import PublicSequenceTask, {
  movePublicSequenceItem,
} from "@/components/public-runtime/PublicSequenceTask";

const ids = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
];

const task = {
  id: "44444444-4444-4444-8444-444444444444",
  taskType: "sequence" as const,
  title: "Расположите события",
  description: null,
  imageUrl: null,
  items: ids.map((id, index) => ({ id, text: `Событие ${index + 1}` })),
};

describe("PublicSequenceTask", () => {
  it("renders the received server order with accessible bounded controls", () => {
    const markup = renderToStaticMarkup(
      createElement(PublicSequenceTask, {
        task,
        disabled: false,
        onChange: vi.fn(),
      })
    );

    expect(markup.indexOf("Событие 1")).toBeLessThan(markup.indexOf("Событие 2"));
    expect(markup).toContain('aria-label="Переместить элемент 1 вверх"');
    expect(markup).toContain('aria-label="Переместить элемент 3 вниз"');
    expect(markup).toMatch(/Переместить элемент 1 вверх[^>]*disabled/);
    expect(markup).toMatch(/Переместить элемент 3 вниз[^>]*disabled/);
  });

  it("moves only the learner-visible order and preserves every item identity", () => {
    expect(movePublicSequenceItem(ids, 0, 1)).toEqual([ids[1], ids[0], ids[2]]);
    expect(movePublicSequenceItem(ids, 0, -1)).toBe(ids);
    expect(movePublicSequenceItem(ids, 2, 1)).toBe(ids);
  });
});
