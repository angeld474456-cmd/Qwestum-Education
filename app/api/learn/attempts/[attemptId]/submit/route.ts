import { parsePublicRuntimeSubmission } from "@/lib/public-runtime-submission";
import { getCurrentActor } from "@/services/current-actor.server";
import {
  submitStudentQuestAttempt,
  StudentAttemptServiceError,
} from "@/services/student-attempt.server";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 32 * 1024;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ attemptId: string }>;
};

const messages = {
  invalidRequest: "Некорректный запрос",
  unavailableAttempt: "Попытка недоступна",
  forbidden: "Доступ запрещен",
  temporaryFailure: "Не удалось проверить ответы. Попробуйте еще раз.",
} as const;

function jsonResponse(body: object, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
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

export async function POST(request: Request, context: RouteContext) {
  const { attemptId } = await context.params;

  if (!uuidPattern.test(attemptId) || !hasJsonContentType(request)) {
    return jsonResponse({ error: messages.invalidRequest }, 400);
  }

  if (contentLengthIsTooLarge(request)) {
    return jsonResponse({ error: messages.invalidRequest }, 400);
  }

  let body: ArrayBuffer;

  try {
    body = await request.arrayBuffer();
  } catch {
    return jsonResponse({ error: messages.invalidRequest }, 400);
  }

  if (body.byteLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: messages.invalidRequest }, 400);
  }

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch {
    return jsonResponse({ error: messages.invalidRequest }, 400);
  }

  const submission = parsePublicRuntimeSubmission(parsedBody);

  if (!submission) {
    return jsonResponse({ error: messages.invalidRequest }, 400);
  }

  const actorResult = await getCurrentActor();

  if (actorResult.status === "unauthenticated") {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  if (
    actorResult.status !== "authenticated" ||
    actorResult.actor.role !== "student"
  ) {
    return jsonResponse({ error: messages.forbidden }, 403);
  }

  try {
    const result = await submitStudentQuestAttempt(attemptId, submission);

    if (!result) {
      return jsonResponse({ error: messages.unavailableAttempt }, 404);
    }

    return jsonResponse({ result: result.result }, 200);
  } catch (error) {
    if (error instanceof StudentAttemptServiceError) {
      return jsonResponse({ error: messages.temporaryFailure }, 500);
    }

    return jsonResponse({ error: messages.temporaryFailure }, 500);
  }
}
