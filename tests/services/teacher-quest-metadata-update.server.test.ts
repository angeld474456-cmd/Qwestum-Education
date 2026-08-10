import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const ownerId = "22222222-2222-4222-8222-222222222222";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), createClient: vi.fn(), rpc: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { updateOwnedQuestMetadata } from "@/services/teacher-quest-metadata-update.server";

const input = {
  questId,
  title: " Updated quest ",
  description: " Updated description ",
  difficulty: 2,
  subjectId: { provided: true, value: null },
  languageCode: { provided: true, value: "ru" },
  category: { provided: true, value: "Science" },
  tags: { provided: true, value: ["Space", "Physics"] },
  gradeMin: { provided: true, value: 5 },
  gradeMax: { provided: true, value: 7 },
  estimatedDurationMinutes: { provided: true, value: 45 },
};

function updatedRow(overrides: Record<string, unknown> = {}) {
  return {
    outcome: "updated",
    id: questId,
    title: "Updated quest",
    description: "Updated description",
    subject_id: null,
    language_code: "ru",
    category: "Science",
    tags: ["Space", "Physics"],
    difficulty: 2,
    is_public: false,
    grade_min: 5,
    grade_max: 7,
    estimated_duration_minutes: 45,
    ...overrides,
  };
}

function emptyOutcome(outcome: "invalid" | "subject_not_found") {
  return {
    outcome,
    id: null,
    title: null,
    description: null,
    subject_id: null,
    language_code: null,
    category: null,
    tags: null,
    difficulty: null,
    is_public: null,
    grade_min: null,
    grade_max: null,
    estimated_duration_minutes: null,
  };
}

function configure(data: unknown, error: unknown = null, user: unknown = { id: ownerId }) {
  mocks.auth.mockResolvedValue({ data: { user } });
  mocks.rpc.mockResolvedValue({ data, error });
  mocks.createClient.mockResolvedValue({ auth: { getUser: mocks.auth }, rpc: mocks.rpc });
}

describe("updateOwnedQuestMetadata", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls the metadata RPC once with exact values and presence flags", async () => {
    configure([updatedRow()]);

    await expect(updateOwnedQuestMetadata(input)).resolves.toMatchObject({
      status: "ok",
      quest: { id: questId, tags: ["Space", "Physics"] },
    });
    expect(mocks.rpc).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenCalledWith("update_owned_quest_metadata", {
      p_quest_id: questId,
      p_title: input.title,
      p_description: input.description,
      p_difficulty: input.difficulty,
      p_subject_id: null,
      p_has_subject_id: true,
      p_language_code: "ru",
      p_has_language_code: true,
      p_category: "Science",
      p_has_category: true,
      p_tags: ["Space", "Physics"],
      p_has_tags: true,
      p_grade_min: 5,
      p_has_grade_min: true,
      p_grade_max: 7,
      p_has_grade_max: true,
      p_estimated_duration_minutes: 45,
      p_has_estimated_duration_minutes: true,
    });
  });

  it("preserves omitted optional fields through false presence flags", async () => {
    configure([updatedRow()]);
    const partial = {
      ...input,
      subjectId: { provided: false, value: null },
      languageCode: { provided: false, value: null },
      category: { provided: false, value: null },
      tags: { provided: false, value: [] },
      gradeMin: { provided: false, value: null },
      gradeMax: { provided: false, value: null },
      estimatedDurationMinutes: { provided: false, value: null },
    };

    await expect(updateOwnedQuestMetadata(partial)).resolves.toMatchObject({ status: "ok" });
    expect(mocks.rpc.mock.calls[0][1]).toMatchObject({
      p_has_subject_id: false,
      p_has_language_code: false,
      p_has_category: false,
      p_has_tags: false,
      p_has_grade_min: false,
      p_has_grade_max: false,
      p_has_estimated_duration_minutes: false,
    });
  });

  it("maps strict safe outcomes", async () => {
    configure([emptyOutcome("invalid")]);
    await expect(updateOwnedQuestMetadata(input)).resolves.toEqual({ status: "invalid" });

    configure([emptyOutcome("subject_not_found")]);
    await expect(updateOwnedQuestMetadata(input)).resolves.toEqual({ status: "subject_not_found" });

    configure([]);
    await expect(updateOwnedQuestMetadata(input)).resolves.toEqual({ status: "not_found" });
  });

  it("maps auth, provider, and malformed results safely", async () => {
    configure(null, null, null);
    await expect(updateOwnedQuestMetadata(input)).resolves.toEqual({ status: "unauthorized" });
    expect(mocks.rpc).not.toHaveBeenCalled();

    configure(null, { message: "RAW_RPC_ERROR" });
    await expect(updateOwnedQuestMetadata(input)).resolves.toEqual({ status: "error" });

    configure([updatedRow({ id: ownerId })]);
    await expect(updateOwnedQuestMetadata(input)).resolves.toEqual({ status: "error" });

    configure([updatedRow(), updatedRow()]);
    await expect(updateOwnedQuestMetadata(input)).resolves.toEqual({ status: "error" });

    configure([{ ...emptyOutcome("invalid"), extra: true }]);
    await expect(updateOwnedQuestMetadata(input)).resolves.toEqual({ status: "error" });
  });
});
