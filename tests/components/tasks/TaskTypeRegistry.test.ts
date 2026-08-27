import { describe, expect, it } from "vitest";

import { taskTypeRegistry } from "@/components/tasks/editor/TaskTypeRegistry";

describe("taskTypeRegistry", () => {
  it("registers Sequence without removing existing teacher task editors", () => {
    expect(Object.keys(taskTypeRegistry).sort()).toEqual([
      "multiple_choice",
      "sequence",
      "single_choice",
      "text",
    ]);
  });
});
