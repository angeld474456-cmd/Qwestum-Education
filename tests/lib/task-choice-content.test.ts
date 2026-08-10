import { describe, expect, it } from "vitest";

import {
  classifyMultipleChoiceContent,
  classifySingleChoiceContent,
  parseMultipleChoiceContent,
  parseSingleChoiceContent,
} from "@/lib/task-choice-content";

const options = [
  { id: "first", text: "Тараз" },
  { id: "second", text: "Москва" },
];

describe("task choice content", () => {
  it("accepts valid final Single Choice and Multiple Choice content", () => {
    expect(parseSingleChoiceContent({ options, correctOptionId: "first" })).toEqual({
      options,
      correctOptionId: "first",
    });
    expect(parseMultipleChoiceContent({ options, correctOptionIds: ["first", "second"] })).toEqual({
      options,
      correctOptionIds: ["first", "second"],
    });
  });

  it("distinguishes an allowed null draft from malformed explicit content", () => {
    expect(classifySingleChoiceContent(null)).toEqual({ state: "draft" });
    expect(classifyMultipleChoiceContent(null)).toEqual({ state: "draft" });
    expect(classifySingleChoiceContent({ options: [], correctOptionId: "first" })).toEqual({ state: "malformed" });
    expect(classifyMultipleChoiceContent({ options: [], correctOptionIds: [] })).toEqual({ state: "malformed" });
  });

  it.each([
    { options: [{ id: "first", text: "A" }], correctOptionId: "first" },
    { options: Array.from({ length: 101 }, (_, index) => ({ id: String(index), text: String(index) })), correctOptionId: "0" },
    { options: [{ id: "", text: "A" }, { id: "second", text: "B" }], correctOptionId: "second" },
    { options: [{ id: "first", text: "A" }, { id: "first", text: "B" }], correctOptionId: "first" },
    { options: [{ id: "x".repeat(129), text: "A" }, { id: "second", text: "B" }], correctOptionId: "second" },
    { options: [{ id: "first", text: " " }, { id: "second", text: "B" }], correctOptionId: "second" },
    { options: [{ id: "first", text: "x".repeat(4001) }, { id: "second", text: "B" }], correctOptionId: "second" },
    { options: [{ id: "first", text: "Тараз" }, { id: "second", text: "  тараз  " }], correctOptionId: "first" },
    { options, correctOptionId: "foreign" },
  ])("rejects malformed Single Choice content", (content) => {
    expect(parseSingleChoiceContent(content)).toBeNull();
  });

  it.each([
    { options, correctOptionIds: ["first"] },
    { options, correctOptionIds: ["first", "first"] },
    { options, correctOptionIds: ["first", "foreign"] },
  ])("rejects malformed Multiple Choice correct IDs", (content) => {
    expect(parseMultipleChoiceContent(content)).toBeNull();
  });
});
