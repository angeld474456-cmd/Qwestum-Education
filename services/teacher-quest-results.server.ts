import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { TeacherQuestAttemptSummary } from "@/types/teacher-quest-results";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const MAX_OFFSET = 10_000;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Row = Record<string, unknown>;

export class TeacherQuestResultsServiceError extends Error {
  constructor() {
    super("Teacher quest results are unavailable.");
  }
}

function isPlainObject(value: unknown): value is Row {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value: Row, keys: readonly string[]) {
  const valueKeys = Object.keys(value);
  return valueKeys.length === keys.length && keys.every((key) => valueKeys.includes(key));
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && !Number.isNaN(Date.parse(value));
}

function isSafeNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function normalizeLimit(value: number | undefined) {
  if (!Number.isInteger(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(value ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
}

function normalizeOffset(value: number | undefined) {
  if (!Number.isInteger(value)) return 0;
  return Math.min(Math.max(value ?? 0, 0), MAX_OFFSET);
}

function mapSummary(value: unknown): TeacherQuestAttemptSummary | null {
  if (
    !isPlainObject(value) ||
    !hasExactKeys(value, [
      "attempt_id",
      "student_display_name",
      "submitted_at",
      "earned_points",
      "possible_points",
    ]) ||
    !isUuid(value.attempt_id) ||
    typeof value.student_display_name !== "string" ||
    !/\S/.test(value.student_display_name) ||
    !isTimestamp(value.submitted_at) ||
    !isSafeNonNegativeInteger(value.earned_points) ||
    !isSafeNonNegativeInteger(value.possible_points) ||
    value.earned_points > value.possible_points
  ) {
    return null;
  }

  return {
    attemptId: value.attempt_id,
    studentDisplayName: value.student_display_name,
    submittedAt: value.submitted_at,
    earnedPoints: value.earned_points,
    possiblePoints: value.possible_points,
    percentage:
      value.possible_points > 0
        ? Math.round((value.earned_points / value.possible_points) * 100)
        : null,
  };
}

export async function listTeacherQuestAttemptSummaries(
  questId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<TeacherQuestAttemptSummary[]> {
  if (!isUuid(questId)) return [];

  const limit = normalizeLimit(options.limit);
  const offset = normalizeOffset(options.offset);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("list_teacher_quest_attempts", {
      p_quest_id: questId,
      p_limit: limit,
      p_offset: offset,
    });

    if (error || !Array.isArray(data)) throw new TeacherQuestResultsServiceError();

    const summaries = data.map(mapSummary);
    if (summaries.some((summary) => summary === null)) {
      throw new TeacherQuestResultsServiceError();
    }

    return summaries as TeacherQuestAttemptSummary[];
  } catch (error) {
    if (error instanceof TeacherQuestResultsServiceError) throw error;
    throw new TeacherQuestResultsServiceError();
  }
}
