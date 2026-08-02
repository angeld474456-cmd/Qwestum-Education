import { describe, expect, it } from "vitest";

import { haveSameOptionIds, parseMultipleChoiceContent } from "@/lib/multiple-choice";

const validContent = {
  options: [
    { id: "first", text: "First" },
    { id: "second", text: "Second" },
    { id: "third", text: "Third" },
  ],
  correctOptionIds: ["first", "third"],
};

describe("multiple choice content contract", () => {
  it("accepts valid content and preserves option order", () => {
    expect(parseMultipleChoiceContent(validContent)).toEqual(validContent);
  });

  it.each([
    [{ options: [{ id: "first", text: "First" }], correctOptionIds: ["first", "second"] }],
    [{ options: [{ id: "", text: "First" }, { id: "second", text: "Second" }], correctOptionIds: ["second", "first"] }],
    [{ options: [{ id: "first", text: " " }, { id: "second", text: "Second" }], correctOptionIds: ["first", "second"] }],
    [{ options: [{ id: "first", text: "First" }, { id: "first", text: "Second" }], correctOptionIds: ["first", "second"] }],
    [{ ...validContent, correctOptionIds: ["first"] }],
    [{ ...validContent, correctOptionIds: ["first", "first"] }],
    [{ ...validContent, correctOptionIds: ["first", "foreign"] }],
    [{ options: Array.from({ length: 101 }, (_, index) => ({ id: String(index), text: String(index) })), correctOptionIds: ["0", "1"] }],
  ])("rejects malformed teacher content", (content) => {
    expect(parseMultipleChoiceContent(content)).toBeNull();
  });

  it("uses exact-set membership independent of selection order", () => {
    expect(haveSameOptionIds(["first", "third"], ["third", "first"])).toBe(true);
    expect(haveSameOptionIds(["first", "third"], ["first"])).toBe(false);
    expect(haveSameOptionIds(["first", "third"], ["first", "third", "wrong"])).toBe(false);
    expect(haveSameOptionIds([], [])).toBe(true);
  });
});
