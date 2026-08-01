import { describe, expect, it } from "vitest";

import {
  getTeacherQuestLibrarySearchParam,
  matchesTeacherQuestLibraryFilters,
} from "@/lib/teacher-quest-library-filters";

const quest = {
  title: "Deep  Biology",
  description: "Explore the cell cycle.",
  category: "Science",
  tags: ["Cells", "Grade 7"],
};

describe("teacher quest library filters", () => {
  it("normalizes missing, blank, and spaced search parameters safely", () => {
    expect(getTeacherQuestLibrarySearchParam(undefined)).toBe("");
    expect(getTeacherQuestLibrarySearchParam("   ")).toBe("");
    expect(getTeacherQuestLibrarySearchParam("  deep   biology  ")).toBe(
      "deep biology"
    );
    expect(getTeacherQuestLibrarySearchParam(["cells", "ignored"])).toBe(
      "cells"
    );
    expect(getTeacherQuestLibrarySearchParam(42)).toBe("");
  });

  it("matches normalized title and description text case-insensitively", () => {
    expect(
      matchesTeacherQuestLibraryFilters(quest, {
        search: "DEEP BIOLOGY",
        category: "",
        tag: "",
      })
    ).toBe(true);
    expect(
      matchesTeacherQuestLibraryFilters(quest, {
        search: "CELL CYCLE",
        category: "",
        tag: "",
      })
    ).toBe(true);
    expect(
      matchesTeacherQuestLibraryFilters({ ...quest, description: null }, {
        search: "cycle",
        category: "",
        tag: "",
      })
    ).toBe(false);
  });

  it("requires text search and existing category/tag filters together", () => {
    expect(
      matchesTeacherQuestLibraryFilters(quest, {
        search: "biology",
        category: "science",
        tag: "cells",
      })
    ).toBe(true);
    expect(
      matchesTeacherQuestLibraryFilters(quest, {
        search: "biology",
        category: "science",
        tag: "history",
      })
    ).toBe(false);
    expect(
      matchesTeacherQuestLibraryFilters(quest, {
        search: "geography",
        category: "science",
        tag: "cells",
      })
    ).toBe(false);
  });
});
