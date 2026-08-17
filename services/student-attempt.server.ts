import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  PublicRuntimeResult,
  PublicRuntimeSubmission,
  PublicRuntimeTaskResult,
  PublicRuntimeTaskStatus,
} from "@/types/public-runtime";
import type {
  StudentAttemptStart,
  StudentAttemptSubmission,
} from "@/types/student-attempt";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const taskStatuses = new Set<PublicRuntimeTaskStatus>([
  "correct",
  "incorrect",
  "unanswered",
  "not_scored",
]);

type RpcRow = Record<string, unknown>;

export class StudentAttemptServiceError extends Error {
  constructor() {
    super("Student attempt service failed.");
  }
}

function isPlainObject(value: unknown): value is RpcRow {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value: RpcRow, keys: readonly string[]) {
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
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function mapTaskResult(value: unknown): PublicRuntimeTaskResult | null {
  if (
    !isPlainObject(value) ||
    !hasExactKeys(value, ["taskId", "status"]) ||
    !isUuid(value.taskId) ||
    typeof value.status !== "string" ||
    !taskStatuses.has(value.status as PublicRuntimeTaskStatus)
  ) {
    return null;
  }

  return {
    taskId: value.taskId,
    status: value.status as PublicRuntimeTaskStatus,
  };
}

function mapResultRow(value: unknown): StudentAttemptSubmission | null {
  if (
    !isPlainObject(value) ||
    !hasExactKeys(value, [
      "attempt_id",
      "earned_points",
      "possible_points",
      "correct_count",
      "incorrect_count",
      "unanswered_count",
      "not_scored_count",
      "task_results",
    ]) ||
    !isUuid(value.attempt_id) ||
    !isSafeNonNegativeInteger(value.earned_points) ||
    !isSafeNonNegativeInteger(value.possible_points) ||
    !isSafeNonNegativeInteger(value.correct_count) ||
    !isSafeNonNegativeInteger(value.incorrect_count) ||
    !isSafeNonNegativeInteger(value.unanswered_count) ||
    !isSafeNonNegativeInteger(value.not_scored_count) ||
    value.earned_points > value.possible_points ||
    !Array.isArray(value.task_results)
  ) {
    return null;
  }

  const taskResults = value.task_results.map(mapTaskResult);

  if (taskResults.some((taskResult) => taskResult === null)) return null;

  const mappedTaskResults = taskResults as PublicRuntimeTaskResult[];
  const taskIds = new Set(mappedTaskResults.map((taskResult) => taskResult.taskId));
  const statusCounts = {
    correct: 0,
    incorrect: 0,
    unanswered: 0,
    not_scored: 0,
  };

  for (const taskResult of mappedTaskResults) {
    statusCounts[taskResult.status] += 1;
  }

  const totalCount =
    value.correct_count +
    value.incorrect_count +
    value.unanswered_count +
    value.not_scored_count;

  if (
    mappedTaskResults.length < 1 ||
    mappedTaskResults.length > 100 ||
    taskIds.size !== mappedTaskResults.length ||
    totalCount !== mappedTaskResults.length ||
    statusCounts.correct !== value.correct_count ||
    statusCounts.incorrect !== value.incorrect_count ||
    statusCounts.unanswered !== value.unanswered_count ||
    statusCounts.not_scored !== value.not_scored_count
  ) {
    return null;
  }

  const result: PublicRuntimeResult = {
    earnedPoints: value.earned_points,
    possiblePoints: value.possible_points,
    correctCount: value.correct_count,
    incorrectCount: value.incorrect_count,
    unansweredCount: value.unanswered_count,
    notScoredCount: value.not_scored_count,
    taskResults: mappedTaskResults,
  };

  return { attemptId: value.attempt_id, result };
}

function mapStartRow(value: unknown): StudentAttemptStart | null {
  if (
    !isPlainObject(value) ||
    !hasExactKeys(value, ["attempt_id", "quest_id", "status", "started_at"]) ||
    !isUuid(value.attempt_id) ||
    !isUuid(value.quest_id) ||
    value.status !== "started" ||
    !isTimestamp(value.started_at)
  ) {
    return null;
  }

  return {
    attemptId: value.attempt_id,
    questId: value.quest_id,
    status: "started",
    startedAt: value.started_at,
  };
}

export async function startStudentQuestAttempt(
  questId: string
): Promise<StudentAttemptStart | null> {
  if (!isUuid(questId)) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("start_student_quest_attempt", {
      p_quest_id: questId,
    });

    if (error || !Array.isArray(data)) {
      throw new StudentAttemptServiceError();
    }

    if (data.length === 0) return null;
    if (data.length !== 1) throw new StudentAttemptServiceError();

    const attempt = mapStartRow(data[0]);

    if (!attempt || attempt.questId !== questId) {
      throw new StudentAttemptServiceError();
    }

    return attempt;
  } catch (error) {
    if (error instanceof StudentAttemptServiceError) throw error;
    throw new StudentAttemptServiceError();
  }
}

export async function submitStudentQuestAttempt(
  attemptId: string,
  submission: PublicRuntimeSubmission
): Promise<StudentAttemptSubmission | null> {
  if (!isUuid(attemptId)) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_student_quest_attempt", {
      p_attempt_id: attemptId,
      p_answers: submission,
    });

    if (error || !Array.isArray(data)) {
      throw new StudentAttemptServiceError();
    }

    if (data.length === 0) return null;
    if (data.length !== 1) throw new StudentAttemptServiceError();

    const submissionResult = mapResultRow(data[0]);

    if (!submissionResult || submissionResult.attemptId !== attemptId) {
      throw new StudentAttemptServiceError();
    }

    return submissionResult;
  } catch (error) {
    if (error instanceof StudentAttemptServiceError) throw error;
    throw new StudentAttemptServiceError();
  }
}
