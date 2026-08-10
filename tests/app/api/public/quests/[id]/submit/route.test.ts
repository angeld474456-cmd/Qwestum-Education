import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  foreignOptionId,
  publicRuntimeResult,
  runtimeQuestId,
  unknownOptionId,
  unknownTaskId,
  validSubmission,
} from "@/tests/fixtures/public-runtime";

const mocks = vi.hoisted(() => ({
  scorePublicRuntimeQuest: vi.fn(),
  checkPublicSubmitRateLimit: vi.fn(),
}));

vi.mock("@/services/public-runtime.server", () => ({
  scorePublicRuntimeQuest: mocks.scorePublicRuntimeQuest,
}));
vi.mock("@/lib/rate-limit/submit-rate-limit.server", () => ({
  checkPublicSubmitRateLimit: mocks.checkPublicSubmitRateLimit,
}));

import { POST } from "@/app/api/public/quests/[id]/submit/route";

const endpoint = `http://localhost/api/public/quests/${runtimeQuestId}/submit`;
const unavailableMessage = "Квест недоступен для прохождения";

function context(id = runtimeQuestId) {
  return { params: Promise.resolve({ id }) };
}

function jsonRequest(body: unknown, headers: HeadersInit = {}) {
  return new Request(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function expectError(response: Response, status: number, message: string) {
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("no-store");
  await expect(response.json()).resolves.toEqual({ error: message });
}

describe("public runtime submit route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkPublicSubmitRateLimit.mockResolvedValue({ status: "allowed" });
  });

  it("returns a sanitized score result and rejects injected top-level fields", async () => {
    mocks.scorePublicRuntimeQuest.mockResolvedValue(publicRuntimeResult);

    const response = await POST(jsonRequest(validSubmission), context());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ result: publicRuntimeResult });
    expect(JSON.stringify(body)).not.toContain("correctOptionId");
    expect(JSON.stringify(body)).not.toContain("private answer");
    expect(JSON.stringify(body)).not.toContain("author_id");
    expect(mocks.scorePublicRuntimeQuest).toHaveBeenCalledWith(
      runtimeQuestId,
      validSubmission
    );

    const injected = await POST(
      jsonRequest({ ...validSubmission, admin: true }),
      context()
    );
    await expectError(injected, 400, "Некорректный запрос");
    expect(mocks.scorePublicRuntimeQuest).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid route ids, content types, malformed JSON, and oversize bodies", async () => {
    await expectError(
      await POST(jsonRequest(validSubmission), context("not-a-uuid")),
      400,
      "Некорректный запрос"
    );
    await expectError(
      await POST(
        new Request(endpoint, { method: "POST", body: JSON.stringify(validSubmission) }),
        context()
      ),
      415,
      "Поддерживается только JSON"
    );
    await expectError(await POST(jsonRequest("{"), context()), 400, "Некорректный запрос");
    await expectError(
      await POST(
        new Request(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
        }),
        context()
      ),
      400,
      "Некорректный запрос"
    );
    await expectError(
      await POST(jsonRequest({ answers: validSubmission.answers, filler: "x".repeat(33 * 1024) }), context()),
      413,
      "Запрос слишком большой"
    );
    await expectError(
      await POST(jsonRequest("x".repeat(33 * 1024)), context()),
      413,
      "Запрос слишком большой"
    );
    expect(mocks.checkPublicSubmitRateLimit).not.toHaveBeenCalled();
  });

  it("rejects missing, malformed, duplicate, and oversized answer collections", async () => {
    const invalidSubmissions = [
      {},
      { answers: "not-an-array" },
      { answers: [] },
      { answers: Array.from({ length: 101 }, () => ({ taskId: runtimeQuestId })) },
      { answers: [{}] },
      { answers: [{ taskId: "not-a-uuid" }] },
      { answers: [{ taskId: runtimeQuestId, selectedOptionId: 1 }] },
      { answers: [{ taskId: runtimeQuestId, unexpected: true }] },
      {
        answers: [
          { taskId: runtimeQuestId },
          { taskId: runtimeQuestId },
        ],
      },
    ];

    for (const submission of invalidSubmissions) {
      await expectError(
        await POST(jsonRequest(submission), context()),
        400,
        "Некорректный запрос"
      );
    }
    expect(mocks.scorePublicRuntimeQuest).not.toHaveBeenCalled();
    expect(mocks.checkPublicSubmitRateLimit).not.toHaveBeenCalled();
  });

  it("normalizes null and whitespace choices to task-only answers", async () => {
    mocks.scorePublicRuntimeQuest.mockResolvedValue(publicRuntimeResult);
    const submission = {
      answers: [
        { taskId: validSubmission.answers[0].taskId, selectedOptionId: null },
        { taskId: validSubmission.answers[1].taskId, selectedOptionId: " \t\r\n " },
      ],
    };

    const response = await POST(jsonRequest(submission), context());

    expect(response.status).toBe(200);
    expect(mocks.scorePublicRuntimeQuest).toHaveBeenCalledWith(runtimeQuestId, {
      answers: submission.answers.map(({ taskId }) => ({ taskId })),
    });
  });

  it("preserves opaque nonblank option ids exactly", async () => {
    mocks.scorePublicRuntimeQuest.mockResolvedValue(publicRuntimeResult);
    const opaqueOptionId = " option/ID:Do-Not-Transform ";
    const submission = {
      answers: [{ taskId: validSubmission.answers[0].taskId, selectedOptionId: opaqueOptionId }],
    };

    await POST(jsonRequest(submission), context());

    expect(mocks.scorePublicRuntimeQuest).toHaveBeenCalledWith(runtimeQuestId, submission);
  });

  it("accepts valid multiple-choice selections without deciding correctness", async () => {
    mocks.scorePublicRuntimeQuest.mockResolvedValue(publicRuntimeResult);
    const submission = {
      answers: [{ taskId: runtimeQuestId, selectedOptionIds: ["second", "first"] }],
    };

    const response = await POST(jsonRequest(submission), context());

    expect(response.status).toBe(200);
    expect(mocks.scorePublicRuntimeQuest).toHaveBeenCalledWith(runtimeQuestId, submission);
  });

  it("rejects malformed multiple-choice answer shapes before the limiter", async () => {
    const invalidSubmissions = [
      { answers: [{ taskId: runtimeQuestId, selectedOptionIds: "first" }] },
      { answers: [{ taskId: runtimeQuestId, selectedOptionIds: null }] },
      { answers: [{ taskId: runtimeQuestId, selectedOptionIds: { id: "first" } }] },
      { answers: [{ taskId: runtimeQuestId, selectedOptionIds: [1] }] },
      { answers: [{ taskId: runtimeQuestId, selectedOptionIds: [""] }] },
      { answers: [{ taskId: runtimeQuestId, selectedOptionIds: [" "] }] },
      { answers: [{ taskId: runtimeQuestId, selectedOptionIds: ["x".repeat(129)] }] },
      { answers: [{ taskId: runtimeQuestId, selectedOptionIds: ["first", "first"] }] },
      { answers: [{ taskId: runtimeQuestId, selectedOptionIds: Array.from({ length: 101 }, (_, index) => String(index)) }] },
      { answers: [{ taskId: runtimeQuestId, selectedOptionId: "first", selectedOptionIds: ["first", "second"] }] },
    ];

    for (const submission of invalidSubmissions) {
      await expectError(await POST(jsonRequest(submission), context()), 400, "\u041d\u0435\u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 \u0437\u0430\u043f\u0440\u043e\u0441");
    }
    expect(mocks.checkPublicSubmitRateLimit).not.toHaveBeenCalled();
  });

  it("maps unavailable exact-set, option, and publication outcomes to generic 404", async () => {
    mocks.scorePublicRuntimeQuest.mockResolvedValue(null);
    const submissions = [
      { answers: validSubmission.answers.slice(0, -1) },
      { answers: [...validSubmission.answers, { taskId: unknownTaskId }] },
      {
        answers: validSubmission.answers.map((answer, index) =>
          index === 4 ? { ...answer, selectedOptionId: unknownOptionId } : answer
        ),
      },
      {
        answers: validSubmission.answers.map((answer, index) =>
          index === 4 ? { ...answer, selectedOptionId: foreignOptionId } : answer
        ),
      },
      validSubmission,
    ];

    for (const submission of submissions) {
      await expectError(
        await POST(jsonRequest(submission), context()),
        404,
        unavailableMessage
      );
    }
  });

  it("maps service failures to a generic no-store response", async () => {
    mocks.scorePublicRuntimeQuest.mockRejectedValue(new Error("private database error"));

    await expectError(
      await POST(jsonRequest(validSubmission), context()),
      500,
      "Не удалось проверить ответы. Попробуйте ещё раз"
    );
  });

  it("returns a generic 429 without scoring when the client limit is exceeded", async () => {
    mocks.checkPublicSubmitRateLimit.mockResolvedValue({
      status: "limited",
      retryAfterSeconds: 4.2,
    });

    const response = await POST(jsonRequest(validSubmission), context());

    await expectError(response, 429, "Too many requests. Please try again later.");
    expect(response.headers.get("retry-after")).toBe("5");
    expect(mocks.scorePublicRuntimeQuest).not.toHaveBeenCalled();
  });

  it("returns a generic 429 without scoring when the client and quest limit is exceeded", async () => {
    mocks.checkPublicSubmitRateLimit.mockResolvedValue({
      status: "limited",
      retryAfterSeconds: 1,
    });

    const response = await POST(jsonRequest(validSubmission), context());

    await expectError(response, 429, "Too many requests. Please try again later.");
    expect(response.headers.get("retry-after")).toBe("1");
    expect(mocks.scorePublicRuntimeQuest).not.toHaveBeenCalled();
  });

  it("returns a generic 503 without scoring when the limiter is unavailable", async () => {
    mocks.checkPublicSubmitRateLimit.mockResolvedValue({ status: "unavailable" });

    const response = await POST(jsonRequest(validSubmission), context());

    await expectError(
      response,
      503,
      "Service temporarily unavailable. Please try again later."
    );
    expect(response.headers.get("retry-after")).toBe("60");
    expect(mocks.scorePublicRuntimeQuest).not.toHaveBeenCalled();
  });
});
