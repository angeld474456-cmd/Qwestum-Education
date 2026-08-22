import type {
  PublicRuntimeSubmission,
  PublicRuntimeSubmissionAnswer,
} from "@/types/public-runtime";

export const MAX_PUBLIC_RUNTIME_ANSWERS = 100;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function hasOwn(value: PlainObject, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function hasExactKeys(value: PlainObject, keys: readonly string[]) {
  return (
    Object.keys(value).length === keys.length &&
    keys.every((key) => hasOwn(value, key))
  );
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

function isAllWhitespace(value: string) {
  return value.replace(/[\s]+/g, "") === "";
}

export function parsePublicRuntimeSubmission(
  value: unknown
): PublicRuntimeSubmission | null {
  if (
    !isPlainObject(value) ||
    !hasExactKeys(value, ["answers"]) ||
    !Array.isArray(value.answers) ||
    value.answers.length < 1 ||
    value.answers.length > MAX_PUBLIC_RUNTIME_ANSWERS
  ) {
    return null;
  }

  const taskIds = new Set<string>();
  const answers: PublicRuntimeSubmissionAnswer[] = [];

  for (const answer of value.answers) {
    if (!isPlainObject(answer) || !hasOwn(answer, "taskId") || !isUuid(answer.taskId)) {
      return null;
    }

    const hasSelectedOptionId = hasOwn(answer, "selectedOptionId");
    const hasSelectedOptionIds = hasOwn(answer, "selectedOptionIds");

    if (
      !hasExactKeys(
        answer,
        hasSelectedOptionId
          ? ["taskId", "selectedOptionId"]
          : hasSelectedOptionIds
            ? ["taskId", "selectedOptionIds"]
            : ["taskId"]
      ) ||
      (hasSelectedOptionId && hasSelectedOptionIds) ||
      taskIds.has(answer.taskId)
    ) {
      return null;
    }

    if (
      hasSelectedOptionId &&
      answer.selectedOptionId !== null &&
      typeof answer.selectedOptionId !== "string"
    ) {
      return null;
    }

    if (hasSelectedOptionIds) {
      if (
        !Array.isArray(answer.selectedOptionIds) ||
        answer.selectedOptionIds.length > MAX_PUBLIC_RUNTIME_ANSWERS ||
        answer.selectedOptionIds.some(
          (optionId) =>
            typeof optionId !== "string" ||
            isAllWhitespace(optionId) ||
            optionId.length > 128
        ) ||
        new Set(answer.selectedOptionIds).size !== answer.selectedOptionIds.length
      ) {
        return null;
      }

      taskIds.add(answer.taskId);
      answers.push(
        answer.selectedOptionIds.length > 0
          ? { taskId: answer.taskId, selectedOptionIds: answer.selectedOptionIds }
          : { taskId: answer.taskId }
      );
      continue;
    }

    taskIds.add(answer.taskId);

    if (
      hasSelectedOptionId &&
      typeof answer.selectedOptionId === "string" &&
      !isAllWhitespace(answer.selectedOptionId)
    ) {
      answers.push({
        taskId: answer.taskId,
        selectedOptionId: answer.selectedOptionId,
      });
    } else {
      answers.push({ taskId: answer.taskId });
    }
  }

  return { answers };
}
