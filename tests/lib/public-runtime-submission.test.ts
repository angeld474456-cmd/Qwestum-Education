import { describe, expect, it } from "vitest";

import { parsePublicRuntimeSubmission } from "@/lib/public-runtime-submission";

const taskId = "7c4cf0cf-42ef-4c1d-a696-8a0be0c2c8c8";
const secondTaskId = "d6db30c3-2d00-47d8-9a9c-2f879c8c36fe";

describe("public runtime submission parser", () => {
  it("preserves the shared valid single- and multiple-choice answer contract", () => {
    expect(
      parsePublicRuntimeSubmission({
        answers: [
          { taskId, selectedOptionId: "option-one" },
          { taskId: secondTaskId, selectedOptionIds: ["a", "b"] },
        ],
      })
    ).toEqual({
      answers: [
        { taskId, selectedOptionId: "option-one" },
        { taskId: secondTaskId, selectedOptionIds: ["a", "b"] },
      ],
    });
  });

  it("normalizes null and blank single-choice values to unanswered", () => {
    expect(
      parsePublicRuntimeSubmission({
        answers: [{ taskId, selectedOptionId: null }],
      })
    ).toEqual({ answers: [{ taskId }] });

    expect(
      parsePublicRuntimeSubmission({
        answers: [{ taskId, selectedOptionId: "  " }],
      })
    ).toEqual({ answers: [{ taskId }] });
  });

  it.each([
    { answers: [{ taskId, selectedOptionId: "a", selectedOptionIds: ["a"] }] },
    { answers: [{ taskId, selectedOptionIds: ["a", "a"] }] },
    { answers: [{ taskId, selectedOptionIds: [" "] }] },
    { answers: [{ taskId }, { taskId }] },
    { answers: [{ taskId: "not-a-uuid" }] },
    { answers: [{ taskId, unexpected: true }] },
  ])("rejects malformed answer shape %#", (submission) => {
    expect(parsePublicRuntimeSubmission(submission)).toBeNull();
  });
});
