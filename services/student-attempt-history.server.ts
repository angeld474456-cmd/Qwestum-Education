import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  PublicRuntimeSingleChoiceOption,
  PublicRuntimeTaskStatus,
} from "@/types/public-runtime";
import type {
  StudentAttemptHistoryDetail,
  StudentAttemptHistoryItem,
  StudentAttemptHistoryResult,
  StudentAttemptHistoryTask,
} from "@/types/student-attempt-history";

const HISTORY_PAGE_SIZE = 20;
const HISTORY_FETCH_LIMIT = HISTORY_PAGE_SIZE + 1;
const MAX_OFFSET = 10_000;
const MAX_TASKS = 100;
const MAX_OPTIONS = 100;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const taskStatuses = new Set<PublicRuntimeTaskStatus>([
  "correct",
  "incorrect",
  "unanswered",
  "not_scored",
]);

type Row = Record<string, unknown>;

export class StudentAttemptHistoryServiceError extends Error {
  constructor() {
    super("Student attempt history is unavailable.");
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

function isNonBlankString(value: unknown): value is string {
  return typeof value === "string" && /\S/.test(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && !Number.isNaN(Date.parse(value));
}

function isSafeNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function normalizeOffset(offset: number | undefined) {
  if (!Number.isInteger(offset)) return 0;
  return Math.min(Math.max(offset ?? 0, 0), MAX_OFFSET);
}

function mapHistoryItem(value: unknown): StudentAttemptHistoryItem | null {
  if (
    !isPlainObject(value) ||
    !hasExactKeys(value, [
      "id",
      "quest_id",
      "started_at",
      "submitted_at",
      "quest_title_snapshot",
      "earned_points",
      "possible_points",
      "correct_count",
      "incorrect_count",
      "unanswered_count",
      "not_scored_count",
    ]) ||
    !isUuid(value.id) ||
    !isUuid(value.quest_id) ||
    !isTimestamp(value.started_at) ||
    !isTimestamp(value.submitted_at) ||
    !isNonBlankString(value.quest_title_snapshot) ||
    !isSafeNonNegativeInteger(value.earned_points) ||
    !isSafeNonNegativeInteger(value.possible_points) ||
    value.earned_points > value.possible_points ||
    !isSafeNonNegativeInteger(value.correct_count) ||
    !isSafeNonNegativeInteger(value.incorrect_count) ||
    !isSafeNonNegativeInteger(value.unanswered_count) ||
    !isSafeNonNegativeInteger(value.not_scored_count)
  ) {
    return null;
  }

  return {
    attemptId: value.id,
    questId: value.quest_id,
    questTitle: value.quest_title_snapshot,
    earnedPoints: value.earned_points,
    possiblePoints: value.possible_points,
    correctCount: value.correct_count,
    incorrectCount: value.incorrect_count,
    unansweredCount: value.unanswered_count,
    notScoredCount: value.not_scored_count,
    startedAt: value.started_at,
    submittedAt: value.submitted_at,
  };
}

function mapOptions(value: unknown): PublicRuntimeSingleChoiceOption[] | null {
  if (!Array.isArray(value) || value.length < 2 || value.length > MAX_OPTIONS) {
    return null;
  }

  const options = value.map((option) => {
    if (
      !isPlainObject(option) ||
      !hasExactKeys(option, ["id", "text"]) ||
      !isNonBlankString(option.id) ||
      !isNonBlankString(option.text)
    ) {
      return null;
    }

    return { id: option.id, text: option.text };
  });

  if (options.some((option) => option === null)) return null;

  const mappedOptions = options as PublicRuntimeSingleChoiceOption[];
  return new Set(mappedOptions.map((option) => option.id)).size === mappedOptions.length
    ? mappedOptions
    : null;
}

function mapHistoryTask(value: unknown): StudentAttemptHistoryTask | null {
  if (
    !isPlainObject(value) ||
    !hasExactKeys(value, [
      "source_task_id",
      "task_order",
      "task_type",
      "task_snapshot",
      "answer_snapshot",
      "status",
      "earned_points",
      "possible_points",
    ]) ||
    !isUuid(value.source_task_id) ||
    !isSafeNonNegativeInteger(value.task_order) ||
    value.task_order < 1 ||
    typeof value.task_type !== "string" ||
    !isPlainObject(value.task_snapshot) ||
    !isPlainObject(value.answer_snapshot) ||
    typeof value.status !== "string" ||
    !taskStatuses.has(value.status as PublicRuntimeTaskStatus) ||
    !isSafeNonNegativeInteger(value.earned_points) ||
    !isSafeNonNegativeInteger(value.possible_points) ||
    value.earned_points > value.possible_points ||
    Object.prototype.hasOwnProperty.call(value.task_snapshot, "content") ||
    Object.prototype.hasOwnProperty.call(value.task_snapshot, "correctOptionId") ||
    Object.prototype.hasOwnProperty.call(value.task_snapshot, "correctOptionIds")
  ) {
    return null;
  }

  const snapshot = value.task_snapshot;

  if (
    !isUuid(snapshot.id) ||
    snapshot.id !== value.source_task_id ||
    !isNonBlankString(snapshot.title) ||
    !isNullableString(snapshot.description) ||
    !isNullableString(snapshot.image_url) ||
    snapshot.task_type !== value.task_type
  ) {
    return null;
  }

  const base = {
    sourceTaskId: value.source_task_id,
    taskOrder: value.task_order,
    title: snapshot.title as string,
    description: snapshot.description as string | null,
    imageUrl: snapshot.image_url as string | null,
    status: value.status as PublicRuntimeTaskStatus,
    earnedPoints: value.earned_points,
    possiblePoints: value.possible_points,
  };

  if (value.task_type === "text") {
    if (
      !hasExactKeys(snapshot, ["id", "task_type", "title", "description", "image_url"]) ||
      !hasExactKeys(value.answer_snapshot, []) ||
      value.status !== "not_scored" ||
      value.earned_points !== 0 ||
      value.possible_points !== 0
    ) {
      return null;
    }

    return { ...base, taskType: "text" };
  }

  if (value.task_type !== "single_choice" && value.task_type !== "multiple_choice") {
    return null;
  }

  if (!hasExactKeys(snapshot, ["id", "task_type", "title", "description", "image_url", "options"])) {
    return null;
  }

  const options = mapOptions(snapshot.options);
  if (!options) return null;

  const optionIds = new Set(options.map((option) => option.id));

  if (value.task_type === "single_choice") {
    if (
      !hasExactKeys(value.answer_snapshot, ["selectedOptionId"]) ||
      (value.answer_snapshot.selectedOptionId !== null &&
        (!isNonBlankString(value.answer_snapshot.selectedOptionId) ||
          !optionIds.has(value.answer_snapshot.selectedOptionId)))
    ) {
      return null;
    }

    return {
      ...base,
      taskType: "single_choice",
      options,
      selectedOptionId: value.answer_snapshot.selectedOptionId,
    };
  }

  if (
    !hasExactKeys(value.answer_snapshot, ["selectedOptionIds"]) ||
    !Array.isArray(value.answer_snapshot.selectedOptionIds) ||
    value.answer_snapshot.selectedOptionIds.some(
      (optionId) => !isNonBlankString(optionId) || !optionIds.has(optionId)
    ) ||
    new Set(value.answer_snapshot.selectedOptionIds).size !==
      value.answer_snapshot.selectedOptionIds.length
  ) {
    return null;
  }

  return {
    ...base,
    taskType: "multiple_choice",
    options,
    selectedOptionIds: value.answer_snapshot.selectedOptionIds,
  };
}

function assertDetailConsistency(
  detail: StudentAttemptHistoryItem,
  tasks: StudentAttemptHistoryTask[]
) {
  if (tasks.length < 1 || tasks.length > MAX_TASKS) return false;

  const taskIds = new Set(tasks.map((task) => task.sourceTaskId));
  const taskOrders = new Set(tasks.map((task) => task.taskOrder));
  const counts = { correct: 0, incorrect: 0, unanswered: 0, not_scored: 0 };

  for (const task of tasks) counts[task.status] += 1;

  return (
    taskIds.size === tasks.length &&
    taskOrders.size === tasks.length &&
    tasks.every((task, index) => task.taskOrder === index + 1) &&
    counts.correct === detail.correctCount &&
    counts.incorrect === detail.incorrectCount &&
    counts.unanswered === detail.unansweredCount &&
    counts.not_scored === detail.notScoredCount &&
    tasks.reduce((total, task) => total + task.earnedPoints, 0) === detail.earnedPoints &&
    tasks.reduce((total, task) => total + task.possiblePoints, 0) === detail.possiblePoints
  );
}

const summaryColumns =
  "id, quest_id, started_at, submitted_at, quest_title_snapshot, earned_points, possible_points, correct_count, incorrect_count, unanswered_count, not_scored_count";

export async function listStudentAttemptHistory(
  options: { offset?: number } = {}
): Promise<StudentAttemptHistoryResult> {
  const offset = normalizeOffset(options.offset);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("quest_attempts")
      .select(summaryColumns)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + HISTORY_FETCH_LIMIT - 1);

    if (error || !Array.isArray(data)) throw new StudentAttemptHistoryServiceError();

    const mapped = data.map(mapHistoryItem);
    if (mapped.some((item) => item === null)) throw new StudentAttemptHistoryServiceError();

    const items = (mapped as StudentAttemptHistoryItem[]).slice(0, HISTORY_PAGE_SIZE);

    return {
      items,
      hasMore: mapped.length > HISTORY_PAGE_SIZE,
      nextOffset: mapped.length > HISTORY_PAGE_SIZE ? offset + HISTORY_PAGE_SIZE : null,
    };
  } catch (error) {
    if (error instanceof StudentAttemptHistoryServiceError) throw error;
    throw new StudentAttemptHistoryServiceError();
  }
}

export async function getStudentAttemptHistoryDetail(
  attemptId: string
): Promise<StudentAttemptHistoryDetail | null> {
  if (!isUuid(attemptId)) return null;

  try {
    const supabase = await createClient();
    const { data: attempt, error: attemptError } = await supabase
      .from("quest_attempts")
      .select(summaryColumns)
      .eq("id", attemptId)
      .eq("status", "submitted")
      .maybeSingle();

    if (attemptError) throw new StudentAttemptHistoryServiceError();
    if (!attempt) return null;

    const summary = mapHistoryItem(attempt);
    if (!summary || summary.attemptId !== attemptId) {
      throw new StudentAttemptHistoryServiceError();
    }

    const { data: answers, error: answersError } = await supabase
      .from("quest_attempt_answers")
      .select(
        "source_task_id, task_order, task_type, task_snapshot, answer_snapshot, status, earned_points, possible_points"
      )
      .eq("attempt_id", attemptId)
      .order("task_order", { ascending: true });

    if (answersError || !Array.isArray(answers)) {
      throw new StudentAttemptHistoryServiceError();
    }

    const tasks = answers.map(mapHistoryTask);
    if (tasks.some((task) => task === null)) throw new StudentAttemptHistoryServiceError();

    const mappedTasks = tasks as StudentAttemptHistoryTask[];
    if (!assertDetailConsistency(summary, mappedTasks)) {
      throw new StudentAttemptHistoryServiceError();
    }

    return { ...summary, tasks: mappedTasks };
  } catch (error) {
    if (error instanceof StudentAttemptHistoryServiceError) throw error;
    throw new StudentAttemptHistoryServiceError();
  }
}
