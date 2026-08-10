import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const mocks = vi.hoisted(() => ({ deleteOwnedQuest: vi.fn(), updateOwnedQuestMetadata: vi.fn() }));

vi.mock("@/services/teacher-quest-deletion.server", () => ({ deleteOwnedQuest: mocks.deleteOwnedQuest }));
vi.mock("@/services/teacher-quest-metadata-update.server", () => ({ updateOwnedQuestMetadata: mocks.updateOwnedQuestMetadata }));

import { DELETE, PATCH } from "@/app/api/teacher/quests/[id]/route";

const context = { params: Promise.resolve({ id: questId }) };
const body = { title: "Updated quest", description: "Updated description", difficulty: 2 };
const quest = { id: questId, ...body, subject_id: null, language_code: null, category: null, tags: [], is_public: false, grade_min: null, grade_max: null, estimated_duration_minutes: null };

function request(value: unknown) {
  return new Request("http://example.test", { method: "PATCH", headers: { "content-type": "application/json" }, body: typeof value === "string" ? value : JSON.stringify(value) });
}

describe("quest settings PATCH", () => {
  beforeEach(() => vi.clearAllMocks());

  it("delegates a valid full update with exact presence flags", async () => {
    mocks.updateOwnedQuestMetadata.mockResolvedValue({ status: "ok", quest });
    const response = await PATCH(request({ ...body, subject_id: null, language_code: "ru", category: " Science ", tags: ["Space", "space", "Physics"], grade_min: 5, grade_max: 7, estimated_duration_minutes: 45 }), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ quest });
    expect(mocks.updateOwnedQuestMetadata).toHaveBeenCalledWith(expect.objectContaining({
      questId, title: body.title, description: body.description, difficulty: 2,
      subjectId: { provided: true, value: null }, languageCode: { provided: true, value: "ru" },
      category: { provided: true, value: "Science" }, tags: { provided: true, value: ["Space", "Physics"] },
      gradeMin: { provided: true, value: 5 }, gradeMax: { provided: true, value: 7 },
      estimatedDurationMinutes: { provided: true, value: 45 },
    }));
  });

  it("preserves omitted optionals and accepts explicit null clears", async () => {
    mocks.updateOwnedQuestMetadata.mockResolvedValue({ status: "ok", quest });
    await PATCH(request(body), context);
    expect(mocks.updateOwnedQuestMetadata).toHaveBeenLastCalledWith(expect.objectContaining({
      subjectId: { provided: false, value: null }, languageCode: { provided: false, value: null },
      category: { provided: false, value: null }, tags: { provided: false, value: [] },
      gradeMin: { provided: false, value: null }, gradeMax: { provided: false, value: null },
      estimatedDurationMinutes: { provided: false, value: null },
    }));

    await PATCH(request({ ...body, subject_id: null, language_code: null, category: null, grade_min: null, grade_max: null, estimated_duration_minutes: null, tags: [] }), context);
    expect(mocks.updateOwnedQuestMetadata).toHaveBeenLastCalledWith(expect.objectContaining({
      subjectId: { provided: true, value: null }, languageCode: { provided: true, value: null },
      category: { provided: true, value: null }, tags: { provided: true, value: [] },
      gradeMin: { provided: true, value: null }, gradeMax: { provided: true, value: null },
      estimatedDurationMinutes: { provided: true, value: null },
    }));
  });

  it("passes partial grade updates to the authoritative final-state validator", async () => {
    mocks.updateOwnedQuestMetadata.mockResolvedValue({ status: "ok", quest });

    const response = await PATCH(request({ ...body, grade_min: 5 }), context);

    expect(response.status).toBe(200);
    expect(mocks.updateOwnedQuestMetadata).toHaveBeenCalledWith(expect.objectContaining({
      gradeMin: { provided: true, value: 5 },
      gradeMax: { provided: false, value: null },
    }));
  });

  it.each([
    [{ ...body, is_public: true }, "Publication state must be changed through the publication action."],
    [{ ...body, title: "   " }, "Title is required."],
    [{ ...body, difficulty: 4 }, "Difficulty must be 1, 2, or 3."],
    [{ ...body, language_code: "fr" }, "Language is invalid."],
    [{ ...body, category: "x".repeat(41) }, "Category must be 40 characters or fewer."],
    [{ ...body, tags: Array.from({ length: 11 }, (_, index) => `tag-${index}`) }, "A maximum of 10 tags is allowed."],
    [{ ...body, grade_min: 8, grade_max: 5 }, "Grade from must be less than or equal to Grade to."],
    [{ ...body, estimated_duration_minutes: 4 }, "Estimated duration must be between 5 and 240."],
  ])("rejects invalid input before the service", async (payload, message) => {
    const response = await PATCH(request(payload), context);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: message });
    expect(mocks.updateOwnedQuestMetadata).not.toHaveBeenCalled();
  });

  it("maps service outcomes without direct base-table writes", async () => {
    const cases = [
      ["unauthorized", 401, { error: "Unauthorized." }],
      ["not_found", 404, { error: "Quest not found." }],
      ["subject_not_found", 400, { error: "Subject is invalid." }],
      ["invalid", 400, { error: "Invalid quest settings." }],
      ["error", 500, { error: "Unable to save quest settings." }],
    ] as const;

    for (const [status, code, expected] of cases) {
      mocks.updateOwnedQuestMetadata.mockResolvedValue({ status });
      const response = await PATCH(request(body), context);
      expect(response.status).toBe(code);
      await expect(response.json()).resolves.toEqual(expected);
    }
  });
});

describe("quest deletion DELETE", () => {
  beforeEach(() => vi.clearAllMocks());

  it("preserves deletion response semantics", async () => {
    mocks.deleteOwnedQuest.mockResolvedValue({ status: "ok" });
    const response = await DELETE(new Request("http://example.test"), context);
    expect(response.status).toBe(204);
    expect(mocks.deleteOwnedQuest).toHaveBeenCalledWith(questId);
  });

  it.each([
    ["unauthorized", 401, { error: "Unauthorized." }],
    ["not_found", 404, { error: "Quest not found." }],
    ["error", 500, { error: "Unable to delete quest." }],
  ] as const)("preserves deletion %s mapping", async (status, code, expected) => {
    mocks.deleteOwnedQuest.mockResolvedValue({ status });

    const response = await DELETE(new Request("http://example.test"), context);

    expect(response.status).toBe(code);
    await expect(response.json()).resolves.toEqual(expected);
  });
});
