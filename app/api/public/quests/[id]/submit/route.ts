import { scorePublicRuntimeQuest } from "@/services/public-runtime.server";
import { checkPublicSubmitRateLimit } from "@/lib/rate-limit/submit-rate-limit.server";
import type {
  PublicRuntimeSubmission,
  PublicRuntimeSubmissionAnswer,
} from "@/types/public-runtime";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 32 * 1024;
const MAX_ANSWERS = 100;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const messages = {
  invalidRequest: "\u041d\u0435\u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 \u0437\u0430\u043f\u0440\u043e\u0441",
  unavailableQuest:
    "\u041a\u0432\u0435\u0441\u0442 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u0434\u043b\u044f \u043f\u0440\u043e\u0445\u043e\u0436\u0434\u0435\u043d\u0438\u044f",
  requestTooLarge:
    "\u0417\u0430\u043f\u0440\u043e\u0441 \u0441\u043b\u0438\u0448\u043a\u043e\u043c \u0431\u043e\u043b\u044c\u0448\u043e\u0439",
  unsupportedMediaType:
    "\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044f \u0442\u043e\u043b\u044c\u043a\u043e JSON",
  temporaryFailure:
    "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u0440\u043e\u0432\u0435\u0440\u0438\u0442\u044c \u043e\u0442\u0432\u0435\u0442\u044b. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437",
  rateLimited: "Too many requests. Please try again later.",
  limiterUnavailable: "Service temporarily unavailable. Please try again later.",
} as const;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PlainObject = Record<string, unknown>;

function jsonResponse(body: object, status: number, headers?: HeadersInit) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, status);
}

function retryErrorResponse(message: string, status: number, retryAfter: number) {
  return jsonResponse(
    { error: message },
    status,
    { "Retry-After": Math.max(1, Math.ceil(retryAfter)).toString() }
  );
}

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

function hasJsonContentType(request: Request) {
  const contentType = request.headers.get("content-type");

  return (
    contentType !== null &&
    contentType.split(";", 1)[0].trim().toLowerCase() === "application/json"
  );
}

function contentLengthIsTooLarge(request: Request) {
  const contentLength = request.headers.get("content-length");

  if (contentLength === null) return false;

  if (!/^\d+$/.test(contentLength)) return true;

  const length = Number(contentLength);

  return !Number.isSafeInteger(length) || length > MAX_BODY_BYTES;
}

function parseSubmission(value: unknown): PublicRuntimeSubmission | null {
  if (
    !isPlainObject(value) ||
    !hasExactKeys(value, ["answers"]) ||
    !Array.isArray(value.answers) ||
    value.answers.length < 1 ||
    value.answers.length > MAX_ANSWERS
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
        answer.selectedOptionIds.length > MAX_ANSWERS ||
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

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!isUuid(id)) {
    return errorResponse(messages.invalidRequest, 400);
  }

  if (!hasJsonContentType(request)) {
    return errorResponse(messages.unsupportedMediaType, 415);
  }

  if (contentLengthIsTooLarge(request)) {
    return errorResponse(messages.requestTooLarge, 413);
  }

  let body: ArrayBuffer;

  try {
    body = await request.arrayBuffer();
  } catch {
    return errorResponse(messages.invalidRequest, 400);
  }

  if (body.byteLength > MAX_BODY_BYTES) {
    return errorResponse(messages.requestTooLarge, 413);
  }

  let parsedBody: unknown;

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(body);
    parsedBody = JSON.parse(text);
  } catch {
    return errorResponse(messages.invalidRequest, 400);
  }

  const submission = parseSubmission(parsedBody);

  if (!submission) {
    return errorResponse(messages.invalidRequest, 400);
  }

  const rateLimit = await checkPublicSubmitRateLimit(request, id);

  if (rateLimit.status === "limited") {
    return retryErrorResponse(
      messages.rateLimited,
      429,
      rateLimit.retryAfterSeconds
    );
  }

  if (rateLimit.status === "unavailable") {
    return retryErrorResponse(messages.limiterUnavailable, 503, 60);
  }

  try {
    const result = await scorePublicRuntimeQuest(id, submission);

    if (!result) {
      return errorResponse(messages.unavailableQuest, 404);
    }

    return jsonResponse({ result }, 200);
  } catch {
    return errorResponse(messages.temporaryFailure, 500);
  }
}
