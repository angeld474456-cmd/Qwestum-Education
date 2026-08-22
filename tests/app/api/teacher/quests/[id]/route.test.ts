import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const legacySubjectId = "22222222-2222-4222-8222-222222222222";
const canonicalSubjectId = "33333333-3333-4333-8333-333333333333";
const mocks = vi.hoisted(() => ({ deleteOwnedQuest: vi.fn(), getTeacherAuthoringAccess: vi.fn(), updateOwnedQuestMetadataV2: vi.fn() }));

vi.mock("@/services/teacher-quest-deletion.server", () => ({ deleteOwnedQuest: mocks.deleteOwnedQuest }));
vi.mock("@/services/teacher-authoring-access.server", () => ({
  getTeacherAuthoringAccess: mocks.getTeacherAuthoringAccess,
}));
vi.mock("@/services/teacher-quest-metadata-update.server", () => ({ updateOwnedQuestMetadataV2: mocks.updateOwnedQuestMetadataV2 }));

import { DELETE, PATCH } from "@/app/api/teacher/quests/[id]/route";

const context = { params: Promise.resolve({ id: questId }) };
const body = { title: "Updated quest", description: "Updated description", difficulty: 2 };
const quest = { id: questId, ...body, mission_intro: null, mission_outro: null, subject_id: null, language_code: null, category: null, tags: [], is_public: false, grade_min: null, grade_max: null, estimated_duration_minutes: null };

function request(value: unknown) {
  return new Request("http://example.test", { method: "PATCH", headers: { "content-type": "application/json" }, body: typeof value === "string" ? value : JSON.stringify(value) });
}

describe("quest settings PATCH", () => {
  beforeEach(() => vi.clearAllMocks());

  it("delegates a valid full update with exact presence flags", async () => {
    mocks.updateOwnedQuestMetadataV2.mockResolvedValue({ status: "ok", quest });
    const response = await PATCH(request({ ...body, subject_id: null, language_code: "ru", category: " Science ", tags: ["Space", "space", "Physics"], grade_min: 5, grade_max: 7, estimated_duration_minutes: 45 }), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ quest });
    expect(mocks.updateOwnedQuestMetadataV2).toHaveBeenCalledWith(expect.objectContaining({
      questId, title: body.title, description: body.description, difficulty: 2,
      subjectId: { provided: true, value: null }, languageCode: { provided: true, value: "ru" },
      category: { provided: true, value: "Science" }, tags: { provided: true, value: ["Space", "Physics"] },
      gradeMin: { provided: true, value: 5 }, gradeMax: { provided: true, value: 7 },
      estimatedDurationMinutes: { provided: true, value: 45 },
      missionIntro: { provided: false, value: null }, missionOutro: { provided: false, value: null },
    }));
  });

  it("preserves omitted optionals and accepts explicit null clears", async () => {
    mocks.updateOwnedQuestMetadataV2.mockResolvedValue({ status: "ok", quest });
    await PATCH(request(body), context);
    expect(mocks.updateOwnedQuestMetadataV2).toHaveBeenLastCalledWith(expect.objectContaining({
      subjectId: { provided: false, value: null }, languageCode: { provided: false, value: null },
      category: { provided: false, value: null }, tags: { provided: false, value: [] },
      gradeMin: { provided: false, value: null }, gradeMax: { provided: false, value: null },
      estimatedDurationMinutes: { provided: false, value: null },
      missionIntro: { provided: false, value: null }, missionOutro: { provided: false, value: null },
    }));

    await PATCH(request({ ...body, subject_id: null, language_code: null, category: null, grade_min: null, grade_max: null, estimated_duration_minutes: null, tags: [] }), context);
    expect(mocks.updateOwnedQuestMetadataV2).toHaveBeenLastCalledWith(expect.objectContaining({
      subjectId: { provided: true, value: null }, languageCode: { provided: true, value: null },
      category: { provided: true, value: null }, tags: { provided: true, value: [] },
      gradeMin: { provided: true, value: null }, gradeMax: { provided: true, value: null },
      estimatedDurationMinutes: { provided: true, value: null },
      missionIntro: { provided: false, value: null }, missionOutro: { provided: false, value: null },
    }));
  });

  it("sends explicit narrative values to the v2 writer and preserves omitted fields", async () => {
    mocks.updateOwnedQuestMetadataV2.mockResolvedValue({
      status: "ok",
      quest: { ...quest, mission_intro: null, mission_outro: "Complete." },
    });

    await PATCH(
      request({
        ...body,
        mission_intro: "Mission briefing\nwith a new line.",
        mission_outro: "",
      }),
      context
    );

    expect(mocks.updateOwnedQuestMetadataV2).toHaveBeenLastCalledWith(
      expect.objectContaining({
        missionIntro: {
          provided: true,
          value: "Mission briefing\nwith a new line.",
        },
        missionOutro: { provided: true, value: "" },
      })
    );

    await PATCH(request(body), context);

    expect(mocks.updateOwnedQuestMetadataV2).toHaveBeenLastCalledWith(
      expect.objectContaining({
        missionIntro: { provided: false, value: null },
        missionOutro: { provided: false, value: null },
      })
    );
  });

  it("preserves an unchanged legacy subject UUID and accepts an explicit canonical switch", async () => {
    mocks.updateOwnedQuestMetadataV2.mockResolvedValue({ status: "ok", quest });

    await PATCH(request({ ...body, subject_id: legacySubjectId }), context);
    expect(mocks.updateOwnedQuestMetadataV2).toHaveBeenLastCalledWith(
      expect.objectContaining({
        subjectId: { provided: true, value: legacySubjectId },
      })
    );

    await PATCH(request({ ...body, subject_id: canonicalSubjectId }), context);
    expect(mocks.updateOwnedQuestMetadataV2).toHaveBeenLastCalledWith(
      expect.objectContaining({
        subjectId: { provided: true, value: canonicalSubjectId },
      })
    );
  });

  it("passes partial grade updates to the authoritative final-state validator", async () => {
    mocks.updateOwnedQuestMetadataV2.mockResolvedValue({ status: "ok", quest });

    const response = await PATCH(request({ ...body, grade_min: 5 }), context);

    expect(response.status).toBe(200);
    expect(mocks.updateOwnedQuestMetadataV2).toHaveBeenCalledWith(expect.objectContaining({
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
    [{ ...body, mission_intro: 1 }, "Narrative text is invalid."],
    [{ ...body, mission_intro: "x".repeat(4001) }, "Narrative text is invalid."],
  ])("rejects invalid input before the service", async (payload, message) => {
    const response = await PATCH(request(payload), context);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: message });
    expect(mocks.updateOwnedQuestMetadataV2).not.toHaveBeenCalled();
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
      mocks.updateOwnedQuestMetadataV2.mockResolvedValue({ status });
      const response = await PATCH(request(body), context);
      expect(response.status).toBe(code);
      await expect(response.json()).resolves.toEqual(expected);
    }
  });
});

describe("quest deletion DELETE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTeacherAuthoringAccess.mockResolvedValue({
      status: "allowed",
      userId: "owner",
    });
  });

  it("denies inactive authoring access before quest deletion and Storage cleanup", async () => {
    mocks.getTeacherAuthoringAccess.mockResolvedValue({ status: "entitlement_inactive" });

    const response = await DELETE(new Request("http://example.test"), context);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Authoring access unavailable." });
    expect(mocks.deleteOwnedQuest).not.toHaveBeenCalled();
  });

  it("preserves the unauthenticated response before quest deletion", async () => {
    mocks.getTeacherAuthoringAccess.mockResolvedValue({ status: "unauthenticated" });

    const response = await DELETE(new Request("http://example.test"), context);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
    expect(mocks.deleteOwnedQuest).not.toHaveBeenCalled();
  });

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
