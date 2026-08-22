import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  PublicRuntimeNarrativeTask,
  PublicRuntimeQuest,
  PublicRuntimeQuestV2,
  PublicRuntimeResult,
  PublicRuntimeSingleChoiceOption,
  PublicRuntimeSubmission,
  PublicRuntimeSubmissionAnswer,
  PublicRuntimeTask,
  PublicRuntimeTaskResult,
  PublicRuntimeTaskStatus,
} from "@/types/public-runtime";

const MAX_TASKS = 100;
const MAX_OPTIONS = 100;
const MAX_ANSWERS = 100;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const taskStatuses = new Set<PublicRuntimeTaskStatus>([
  "correct",
  "incorrect",
  "unanswered",
  "not_scored",
]);

type RpcRow = Record<string, unknown>;

function runtimeError(message: string): never {
  throw new Error(message);
}

function isPlainObject(value: unknown): value is RpcRow {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(value: RpcRow, keys: readonly string[]) {
  return Object.keys(value).every((key) => keys.includes(key));
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

function isSafeNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function assertValidQuestId(id: string) {
  if (!isUuid(id)) {
    runtimeError("Public runtime request is invalid.");
  }
}

function mapSingleChoiceOption(
  value: unknown
): PublicRuntimeSingleChoiceOption | null {
  if (!isPlainObject(value)) return null;

  if (!isNonBlankString(value.id) || !isNonBlankString(value.text)) {
    return null;
  }

  return {
    id: value.id,
    text: value.text,
  };
}

function mapRuntimeV2Option(
  value: unknown
): PublicRuntimeSingleChoiceOption | null {
  if (!isPlainObject(value)) return null;

  const keys = Object.keys(value);

  if (
    keys.length !== 2 ||
    !keys.includes("id") ||
    !keys.includes("text") ||
    !isNonBlankString(value.id) ||
    !isNonBlankString(value.text)
  ) {
    return null;
  }

  return {
    id: value.id,
    text: value.text,
  };
}

function mapRuntimeTask(value: unknown): PublicRuntimeTask | null {
  if (!isPlainObject(value)) return null;

  if (
    !isUuid(value.id) ||
    !isNonBlankString(value.title) ||
    !isNullableString(value.description) ||
    !Object.prototype.hasOwnProperty.call(value, "image_url") ||
    !isNullableString(value.image_url) ||
    typeof value.task_type !== "string"
  ) {
    return null;
  }

  if (value.task_type === "text") {
    return {
      id: value.id,
      taskType: "text",
      title: value.title,
      description: value.description,
      imageUrl: value.image_url,
    };
  }

  if (value.task_type !== "single_choice" && value.task_type !== "multiple_choice") return null;

  if (
    !Array.isArray(value.options) ||
    value.options.length < 2 ||
    value.options.length > MAX_OPTIONS
  ) {
    return null;
  }

  const options = value.options.map(mapSingleChoiceOption);

  if (options.some((option) => option === null)) return null;

  const mappedOptions = options as PublicRuntimeSingleChoiceOption[];
  const optionIds = new Set(mappedOptions.map((option) => option.id));

  if (optionIds.size !== mappedOptions.length) return null;

  return {
    id: value.id,
    taskType: value.task_type,
    title: value.title,
    description: value.description,
    imageUrl: value.image_url,
    options: mappedOptions,
  };
}

function mapPublicRuntimeQuestRow(value: unknown): PublicRuntimeQuest | null {
  if (
    !isPlainObject(value) ||
    !isUuid(value.id) ||
    !isNonBlankString(value.title) ||
    !isNullableString(value.description) ||
    !Array.isArray(value.tasks) ||
    value.tasks.length < 1 ||
    value.tasks.length > MAX_TASKS
  ) {
    return null;
  }

  const tasks = value.tasks.map(mapRuntimeTask);

  if (tasks.some((task) => task === null)) return null;

  const mappedTasks = tasks as PublicRuntimeTask[];
  const taskIds = new Set(mappedTasks.map((task) => task.id));

  if (taskIds.size !== mappedTasks.length) return null;

  return {
    id: value.id,
    title: value.title,
    description: value.description,
    tasks: mappedTasks,
  };
}

function mapRuntimeV2Task(value: unknown): PublicRuntimeNarrativeTask | null {
  if (!isPlainObject(value)) return null;

  if (
    !Object.prototype.hasOwnProperty.call(value, "narrative_intro") ||
    !Object.prototype.hasOwnProperty.call(value, "narrative_success") ||
    !isNullableString(value.narrative_intro) ||
    !isNullableString(value.narrative_success)
  ) {
    return null;
  }

  const baseKeys = [
    "description",
    "id",
    "image_url",
    "narrative_intro",
    "narrative_success",
    "task_type",
    "title",
  ];
  const choiceKeys = [...baseKeys, "options"];
  const expectedKeys = value.task_type === "text" ? baseKeys : choiceKeys;

  if (!hasOnlyKeys(value, expectedKeys)) return null;

  const task = mapRuntimeTask(value);

  if (!task) return null;

  if (task.taskType === "text") {
    return {
      ...task,
      narrativeIntro: value.narrative_intro,
      narrativeSuccess: value.narrative_success,
    };
  }

  if (!Array.isArray(value.options)) return null;

  const options = value.options.map(mapRuntimeV2Option);

  if (options.some((option) => option === null)) return null;

  const mappedOptions = options as PublicRuntimeSingleChoiceOption[];

  if (new Set(mappedOptions.map((option) => option.id)).size !== mappedOptions.length) {
    return null;
  }

  return {
    ...task,
    options: mappedOptions,
    narrativeIntro: value.narrative_intro,
    narrativeSuccess: value.narrative_success,
  };
}

function mapPublicRuntimeQuestV2Row(value: unknown): PublicRuntimeQuestV2 | null {
  if (
    !isPlainObject(value) ||
    !hasOnlyKeys(value, [
      "description",
      "id",
      "mission_intro",
      "mission_outro",
      "tasks",
      "title",
    ]) ||
    !isUuid(value.id) ||
    !isNonBlankString(value.title) ||
    !isNullableString(value.description) ||
    !isNullableString(value.mission_intro) ||
    !isNullableString(value.mission_outro) ||
    !Array.isArray(value.tasks) ||
    value.tasks.length < 1 ||
    value.tasks.length > MAX_TASKS
  ) {
    return null;
  }

  const tasks = value.tasks.map(mapRuntimeV2Task);

  if (tasks.some((task) => task === null)) return null;

  const mappedTasks = tasks as PublicRuntimeNarrativeTask[];
  const taskIds = new Set(mappedTasks.map((task) => task.id));

  if (taskIds.size !== mappedTasks.length) return null;

  return {
    id: value.id,
    title: value.title,
    description: value.description,
    missionIntro: value.mission_intro,
    missionOutro: value.mission_outro,
    tasks: mappedTasks,
  };
}

function mapTaskResult(value: unknown): PublicRuntimeTaskResult | null {
  if (!isPlainObject(value)) return null;

  if (!isUuid(value.taskId) || typeof value.status !== "string") {
    return null;
  }

  if (!taskStatuses.has(value.status as PublicRuntimeTaskStatus)) {
    return null;
  }

  return {
    taskId: value.taskId,
    status: value.status as PublicRuntimeTaskStatus,
  };
}

function mapPublicRuntimeResultRow(value: unknown): PublicRuntimeResult | null {
  if (
    !isPlainObject(value) ||
    !isSafeNonNegativeInteger(value.earned_points) ||
    !isSafeNonNegativeInteger(value.possible_points) ||
    !isSafeNonNegativeInteger(value.correct_count) ||
    !isSafeNonNegativeInteger(value.incorrect_count) ||
    !isSafeNonNegativeInteger(value.unanswered_count) ||
    !isSafeNonNegativeInteger(value.not_scored_count) ||
    value.earned_points > value.possible_points ||
    !Array.isArray(value.task_results) ||
    value.task_results.length < 1 ||
    value.task_results.length > MAX_TASKS
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
    taskIds.size !== mappedTaskResults.length ||
    totalCount !== mappedTaskResults.length ||
    statusCounts.correct !== value.correct_count ||
    statusCounts.incorrect !== value.incorrect_count ||
    statusCounts.unanswered !== value.unanswered_count ||
    statusCounts.not_scored !== value.not_scored_count
  ) {
    return null;
  }

  return {
    earnedPoints: value.earned_points,
    possiblePoints: value.possible_points,
    correctCount: value.correct_count,
    incorrectCount: value.incorrect_count,
    unansweredCount: value.unanswered_count,
    notScoredCount: value.not_scored_count,
    taskResults: mappedTaskResults,
  };
}

function validateSubmission(
  submission: PublicRuntimeSubmission
): PublicRuntimeSubmission {
  if (
    !isPlainObject(submission) ||
    !hasOnlyKeys(submission, ["answers"]) ||
    !Array.isArray(submission.answers) ||
    submission.answers.length < 1 ||
    submission.answers.length > MAX_ANSWERS
  ) {
    runtimeError("Public runtime submission is invalid.");
  }

  const answers: PublicRuntimeSubmissionAnswer[] = [];
  const taskIds = new Set<string>();

  for (const answer of submission.answers) {
    if (!isPlainObject(answer) || !isUuid(answer.taskId)) {
      runtimeError("Public runtime submission is invalid.");
    }

    const taskId = answer.taskId;
    const rawAnswer = answer as RpcRow;
    const hasSelectedOptionId = Object.prototype.hasOwnProperty.call(
      rawAnswer,
      "selectedOptionId"
    );
    const hasSelectedOptionIds = Object.prototype.hasOwnProperty.call(rawAnswer, "selectedOptionIds");
    const selectedOptionId = rawAnswer.selectedOptionId;
    const selectedOptionIds = rawAnswer.selectedOptionIds;

    if (
      !hasOnlyKeys(
        rawAnswer,
        hasSelectedOptionId ? ["taskId", "selectedOptionId"] : hasSelectedOptionIds ? ["taskId", "selectedOptionIds"] : ["taskId"]
      ) ||
      (hasSelectedOptionId && typeof selectedOptionId !== "string") ||
      (hasSelectedOptionIds && (!Array.isArray(selectedOptionIds) || selectedOptionIds.some((id) => typeof id !== "string" || !/\S/.test(id) || id.length > 128) || new Set(selectedOptionIds).size !== selectedOptionIds.length)) ||
      (hasSelectedOptionId && hasSelectedOptionIds) ||
      taskIds.has(taskId)
    ) {
      runtimeError("Public runtime submission is invalid.");
    }

    taskIds.add(taskId);
    answers.push(
      hasSelectedOptionId
        ? {
            taskId,
            selectedOptionId: selectedOptionId as string,
          }
        : hasSelectedOptionIds && (selectedOptionIds as string[]).length > 0
          ? { taskId, selectedOptionIds: selectedOptionIds as string[] }
          : { taskId }
    );
  }

  return { answers };
}

export async function getPublicRuntimeQuest(
  id: string
): Promise<PublicRuntimeQuest | null> {
  assertValidQuestId(id);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_runtime_quest", {
    p_quest_id: id,
  });

  if (error || !Array.isArray(data)) {
    runtimeError("Public runtime fetch failed.");
  }

  if (data.length === 0) return null;

  if (data.length !== 1) {
    runtimeError("Public runtime fetch returned invalid data.");
  }

  const quest = mapPublicRuntimeQuestRow(data[0]);

  if (!quest) {
    runtimeError("Public runtime fetch returned invalid data.");
  }

  return quest;
}

export async function getPublicRuntimeQuestV2(
  id: string
): Promise<PublicRuntimeQuestV2 | null> {
  assertValidQuestId(id);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_runtime_quest_v2", {
    p_quest_id: id,
  });

  if (error || !Array.isArray(data)) {
    runtimeError("Public runtime fetch failed.");
  }

  if (data.length === 0) return null;

  if (data.length !== 1) {
    runtimeError("Public runtime fetch returned invalid data.");
  }

  const quest = mapPublicRuntimeQuestV2Row(data[0]);

  if (!quest) {
    runtimeError("Public runtime fetch returned invalid data.");
  }

  return quest;
}

export async function scorePublicRuntimeQuest(
  id: string,
  submission: PublicRuntimeSubmission
): Promise<PublicRuntimeResult | null> {
  assertValidQuestId(id);
  const validatedSubmission = validateSubmission(submission);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("score_public_runtime_quest", {
    p_quest_id: id,
    p_answers: validatedSubmission,
  });

  if (error || !Array.isArray(data)) {
    runtimeError("Public runtime scoring failed.");
  }

  if (data.length === 0) return null;

  if (data.length !== 1) {
    runtimeError("Public runtime scoring returned invalid data.");
  }

  const result = mapPublicRuntimeResultRow(data[0]);

  if (!result) {
    runtimeError("Public runtime scoring returned invalid data.");
  }

  return result;
}
