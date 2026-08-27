import { describe, expect, it } from "vitest";

import {
  getSequenceValidationMessages,
  getTeacherSequencePreviewOrder,
  moveSequenceItem,
  parseSequenceTaskContent,
  serializeSequenceTaskContent,
} from "@/lib/sequence-task-content";

const ids = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
];

const content = {
  items: [
    { id: ids[0], text: "Первый" },
    { id: ids[1], text: "Второй" },
    { id: ids[2], text: "Третий" },
  ],
  correctOrder: [ids[2], ids[0], ids[1]],
};

describe("Sequence task content", () => {
  it("strictly restores canonical editor order and serializes only the two stored keys", () => {
    expect(parseSequenceTaskContent(content)).toEqual({
      items: [content.items[2], content.items[0], content.items[1]],
      correctOrder: content.correctOrder,
    });

    expect(serializeSequenceTaskContent(content.items)).toEqual({
      items: content.items,
      correctOrder: ids,
    });
  });

  it("fails closed for malformed, extra, duplicate, blank, and overlong content", () => {
    const invalidValues = [
      { ...content, extra: true },
      { ...content, items: [{ id: ids[0], text: "A" }, { id: ids[0], text: "B" }, content.items[2]] },
      { ...content, items: [{ id: ids[0], text: "Same" }, { id: ids[1], text: " same " }, content.items[2]] },
      { ...content, items: [{ id: ids[0], text: " " }, content.items[1], content.items[2]] },
      { ...content, items: [{ id: ids[0], text: "x".repeat(1001) }, content.items[1], content.items[2]] },
      { ...content, correctOrder: [ids[0], ids[0], ids[2]] },
      { ...content, correctOrder: [ids[0], ids[1], "44444444-4444-4444-8444-444444444444"] },
    ];

    for (const invalidValue of invalidValues) {
      expect(parseSequenceTaskContent(invalidValue)).toBeNull();
    }
  });

  it("reports client-side item validation without replacing server authority", () => {
    expect(getSequenceValidationMessages([
      { id: ids[0], text: " " },
      { id: ids[1], text: "Same" },
      { id: ids[2], text: " same " },
    ])).toEqual(expect.arrayContaining([
      "Заполните текст каждого элемента.",
      "Элементы не должны повторяться.",
    ]));
  });

  it("keeps stable identities while moving canonical rows and creates a deterministic noncanonical preview order", () => {
    const moved = moveSequenceItem(content.items, 0, 1);
    expect(moved.map((item) => item.id)).toEqual([ids[1], ids[0], ids[2]]);
    expect(moved[1]).toBe(content.items[0]);
    expect(moveSequenceItem(content.items, 0, -1)).toBe(content.items);

    const firstOrder = getTeacherSequencePreviewOrder("task-1", content.items, ids);
    expect(getTeacherSequencePreviewOrder("task-1", content.items, ids)).toEqual(firstOrder);
    expect(firstOrder).toHaveLength(3);
    expect(new Set(firstOrder)).toEqual(new Set(ids));
    expect(firstOrder).not.toEqual(ids);
  });
});
