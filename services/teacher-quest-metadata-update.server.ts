import "server-only";

import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type OptionalField<T> = { provided: boolean; value: T };

export type UpdateOwnedQuestMetadataInput = {
  questId: string;
  title: string;
  description: string;
  difficulty: number;
  subjectId: OptionalField<string | null>;
  languageCode: OptionalField<string | null>;
  category: OptionalField<string | null>;
  tags: OptionalField<string[]>;
  gradeMin: OptionalField<number | null>;
  gradeMax: OptionalField<number | null>;
  estimatedDurationMinutes: OptionalField<number | null>;
};

export type QuestMetadataDto = {
  id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  language_code: string | null;
  category: string | null;
  tags: string[];
  difficulty: number;
  is_public: boolean;
  grade_min: number | null;
  grade_max: number | null;
  estimated_duration_minutes: number | null;
};

export type UpdateOwnedQuestMetadataV2Input = UpdateOwnedQuestMetadataInput & {
  missionIntro: OptionalField<string | null>;
  missionOutro: OptionalField<string | null>;
};

export type QuestMetadataV2Dto = QuestMetadataDto & {
  mission_intro: string | null;
  mission_outro: string | null;
};

export type UpdateOwnedQuestMetadataResult =
  | { status: "ok"; quest: QuestMetadataDto }
  | { status: "invalid" | "subject_not_found" }
  | { status: "unauthorized" | "not_found" | "error" };

export type UpdateOwnedQuestMetadataV2Result =
  | { status: "ok"; quest: QuestMetadataV2Dto }
  | { status: "invalid" | "subject_not_found" }
  | { status: "unauthorized" | "not_found" | "error" };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isNullableInteger(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isSafeInteger(value));
}

function isEmptyOutcome(row: Record<string, unknown>, outcome: string) {
  const expectedKeys = [
    "category",
    "description",
    "difficulty",
    "estimated_duration_minutes",
    "grade_max",
    "grade_min",
    "id",
    "is_public",
    "language_code",
    "outcome",
    "subject_id",
    "tags",
    "title",
  ];
  const keys = Object.keys(row).sort();

  return (
    keys.length === expectedKeys.length &&
    keys.every((key, index) => key === expectedKeys[index]) &&
    row.outcome === outcome &&
    row.id === null &&
    row.title === null &&
    row.description === null &&
    row.subject_id === null &&
    row.language_code === null &&
    row.category === null &&
    row.tags === null &&
    row.difficulty === null &&
    row.is_public === null &&
    row.grade_min === null &&
    row.grade_max === null &&
    row.estimated_duration_minutes === null
  );
}

function mapUpdatedQuest(value: unknown, questId: string): QuestMetadataDto | null {
  if (!isPlainObject(value)) return null;

  const expectedKeys = [
    "category",
    "description",
    "difficulty",
    "estimated_duration_minutes",
    "grade_max",
    "grade_min",
    "id",
    "is_public",
    "language_code",
    "outcome",
    "subject_id",
    "tags",
    "title",
  ];
  const keys = Object.keys(value).sort();

  if (
    keys.length !== expectedKeys.length ||
    keys.some((key, index) => key !== expectedKeys[index]) ||
    value.outcome !== "updated" ||
    value.id !== questId ||
    typeof value.title !== "string" ||
    !isNullableString(value.description) ||
    !isNullableString(value.subject_id) ||
    !isNullableString(value.language_code) ||
    !isNullableString(value.category) ||
    !Array.isArray(value.tags) ||
    !value.tags.every((tag) => typeof tag === "string") ||
    typeof value.difficulty !== "number" ||
    !Number.isSafeInteger(value.difficulty) ||
    typeof value.is_public !== "boolean" ||
    !isNullableInteger(value.grade_min) ||
    !isNullableInteger(value.grade_max) ||
    !isNullableInteger(value.estimated_duration_minutes)
  ) {
    return null;
  }

  return {
    id: value.id,
    title: value.title,
    description: value.description,
    subject_id: value.subject_id,
    language_code: value.language_code,
    category: value.category,
    tags: value.tags,
    difficulty: value.difficulty,
    is_public: value.is_public,
    grade_min: value.grade_min,
    grade_max: value.grade_max,
    estimated_duration_minutes: value.estimated_duration_minutes,
  };
}

function isEmptyV2Outcome(row: Record<string, unknown>, outcome: string) {
  const expectedKeys = [
    "category",
    "description",
    "difficulty",
    "estimated_duration_minutes",
    "grade_max",
    "grade_min",
    "id",
    "is_public",
    "language_code",
    "mission_intro",
    "mission_outro",
    "outcome",
    "subject_id",
    "tags",
    "title",
  ];
  const keys = Object.keys(row).sort();

  return (
    keys.length === expectedKeys.length &&
    keys.every((key, index) => key === expectedKeys[index]) &&
    row.outcome === outcome &&
    row.id === null &&
    row.title === null &&
    row.description === null &&
    row.subject_id === null &&
    row.language_code === null &&
    row.category === null &&
    row.tags === null &&
    row.difficulty === null &&
    row.is_public === null &&
    row.grade_min === null &&
    row.grade_max === null &&
    row.estimated_duration_minutes === null &&
    row.mission_intro === null &&
    row.mission_outro === null
  );
}

function mapUpdatedQuestV2(value: unknown, questId: string): QuestMetadataV2Dto | null {
  if (!isPlainObject(value)) return null;

  const expectedKeys = [
    "category",
    "description",
    "difficulty",
    "estimated_duration_minutes",
    "grade_max",
    "grade_min",
    "id",
    "is_public",
    "language_code",
    "mission_intro",
    "mission_outro",
    "outcome",
    "subject_id",
    "tags",
    "title",
  ];
  const keys = Object.keys(value).sort();

  if (
    keys.length !== expectedKeys.length ||
    keys.some((key, index) => key !== expectedKeys[index]) ||
    value.outcome !== "updated" ||
    !isNullableString(value.mission_intro) ||
    !isNullableString(value.mission_outro)
  ) {
    return null;
  }

  const quest = mapUpdatedQuest(
    Object.fromEntries(
      Object.entries(value).filter(
        ([key]) => key !== "mission_intro" && key !== "mission_outro"
      )
    ),
    questId
  );

  return quest
    ? {
        ...quest,
        mission_intro: value.mission_intro,
        mission_outro: value.mission_outro,
      }
    : null;
}

export async function updateOwnedQuestMetadata(
  input: UpdateOwnedQuestMetadataInput
): Promise<UpdateOwnedQuestMetadataResult> {
  if (!uuidPattern.test(input.questId)) return { status: "not_found" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "unauthorized" };

  let data: unknown;
  let error: unknown;

  try {
    ({ data, error } = await supabase.rpc("update_owned_quest_metadata", {
      p_quest_id: input.questId,
      p_title: input.title,
      p_description: input.description,
      p_difficulty: input.difficulty,
      p_subject_id: input.subjectId.value,
      p_has_subject_id: input.subjectId.provided,
      p_language_code: input.languageCode.value,
      p_has_language_code: input.languageCode.provided,
      p_category: input.category.value,
      p_has_category: input.category.provided,
      p_tags: input.tags.value,
      p_has_tags: input.tags.provided,
      p_grade_min: input.gradeMin.value,
      p_has_grade_min: input.gradeMin.provided,
      p_grade_max: input.gradeMax.value,
      p_has_grade_max: input.gradeMax.provided,
      p_estimated_duration_minutes: input.estimatedDurationMinutes.value,
      p_has_estimated_duration_minutes: input.estimatedDurationMinutes.provided,
    }));
  } catch {
    return { status: "error" };
  }

  if (error || !Array.isArray(data)) return { status: "error" };
  if (data.length === 0) return { status: "not_found" };
  if (data.length !== 1 || !isPlainObject(data[0])) return { status: "error" };

  const quest = mapUpdatedQuest(data[0], input.questId);
  if (quest) return { status: "ok", quest };
  if (isEmptyOutcome(data[0], "invalid")) return { status: "invalid" };
  if (isEmptyOutcome(data[0], "subject_not_found")) {
    return { status: "subject_not_found" };
  }

  return { status: "error" };
}

export async function updateOwnedQuestMetadataV2(
  input: UpdateOwnedQuestMetadataV2Input
): Promise<UpdateOwnedQuestMetadataV2Result> {
  if (!uuidPattern.test(input.questId)) return { status: "not_found" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "unauthorized" };

  let data: unknown;
  let error: unknown;

  try {
    ({ data, error } = await supabase.rpc("update_owned_quest_metadata_v2", {
      p_quest_id: input.questId,
      p_title: input.title,
      p_description: input.description,
      p_difficulty: input.difficulty,
      p_subject_id: input.subjectId.value,
      p_has_subject_id: input.subjectId.provided,
      p_language_code: input.languageCode.value,
      p_has_language_code: input.languageCode.provided,
      p_category: input.category.value,
      p_has_category: input.category.provided,
      p_tags: input.tags.value,
      p_has_tags: input.tags.provided,
      p_grade_min: input.gradeMin.value,
      p_has_grade_min: input.gradeMin.provided,
      p_grade_max: input.gradeMax.value,
      p_has_grade_max: input.gradeMax.provided,
      p_estimated_duration_minutes: input.estimatedDurationMinutes.value,
      p_has_estimated_duration_minutes: input.estimatedDurationMinutes.provided,
      p_mission_intro: input.missionIntro.value,
      p_has_mission_intro: input.missionIntro.provided,
      p_mission_outro: input.missionOutro.value,
      p_has_mission_outro: input.missionOutro.provided,
    }));
  } catch {
    return { status: "error" };
  }

  if (error || !Array.isArray(data)) return { status: "error" };
  if (data.length === 0) return { status: "not_found" };
  if (data.length !== 1 || !isPlainObject(data[0])) return { status: "error" };

  const quest = mapUpdatedQuestV2(data[0], input.questId);
  if (quest) return { status: "ok", quest };
  if (isEmptyV2Outcome(data[0], "invalid")) return { status: "invalid" };
  if (isEmptyV2Outcome(data[0], "subject_not_found")) {
    return { status: "subject_not_found" };
  }

  return { status: "error" };
}
