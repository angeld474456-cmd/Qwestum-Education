import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentActor: vi.fn(),
  submitStudentQuestAttempt: vi.fn(),
}));

const StudentAttemptServiceError = vi.hoisted(
  () => class StudentAttemptServiceError extends Error {}
);

vi.mock("@/services/current-actor.server", () => ({
  getCurrentActor: mocks.getCurrentActor,
}));
vi.mock("@/services/student-attempt.server", () => ({
  submitStudentQuestAttempt: mocks.submitStudentQuestAttempt,
  StudentAttemptServiceError,
}));

import { POST } from "@/app/api/learn/attempts/[attemptId]/submit/route";

const attemptId = "b5f1f56a-6014-4d33-8c49-87b10a78f76e";
const taskId = "d6db30c3-2d00-47d8-9a9c-2f879c8c36fe";
const submission = { answers: [{ taskId, selectedOptionId: "option-one" }] };
const result = {
  earnedPoints: 3,
  possiblePoints: 5,
  correctCount: 1,
  incorrectCount: 0,
  unansweredCount: 0,
  notScoredCount: 0,
  taskResults: [{ taskId, status: "correct" as const }],
};

function context(id = attemptId) {
  return { params: Promise.resolve({ attemptId: id }) };
}

function request(body: unknown, headers: HeadersInit = { "Content-Type": "application/json" }) {
  return new Request("https://app.example/api/learn/attempts/id/submit", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentActor.mockResolvedValue({
    status: "authenticated",
    actor: { id: "student-id", role: "student", email: "student@example.test" },
  });
});

describe("learner attempt submit route", () => {
  it("returns a persisted result and sends the normalized shared submission", async () => {
    mocks.submitStudentQuestAttempt.mockResolvedValue({ attemptId, result });

    const response = await POST(request({ answers: [{ taskId, selectedOptionId: null }] }), context());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ result });
    expect(mocks.submitStudentQuestAttempt).toHaveBeenCalledWith(attemptId, {
      answers: [{ taskId }],
    });
  });

  it("rejects unauthenticated and non-student actors before the RPC", async () => {
    mocks.getCurrentActor.mockResolvedValueOnce({ status: "unauthenticated" });
    expect((await POST(request(submission), context())).status).toBe(401);

    mocks.getCurrentActor.mockResolvedValueOnce({
      status: "authenticated",
      actor: { id: "teacher-id", role: "teacher", email: "teacher@example.test" },
    });
    expect((await POST(request(submission), context())).status).toBe(403);

    mocks.getCurrentActor.mockResolvedValueOnce({ status: "profile_unavailable" });
    expect((await POST(request(submission), context())).status).toBe(403);
    expect(mocks.submitStudentQuestAttempt).not.toHaveBeenCalled();
  });

  it("rejects malformed attempt identifiers and submissions before actor/RPC calls", async () => {
    expect((await POST(request(submission), context("not-a-uuid"))).status).toBe(400);
    expect((await POST(request({ answers: [{ taskId, selectedOptionIds: ["a", "a"] }] }), context())).status).toBe(400);
    expect((await POST(request(submission, { "Content-Type": "text/plain" }), context())).status).toBe(400);
    expect(mocks.getCurrentActor).not.toHaveBeenCalled();
    expect(mocks.submitStudentQuestAttempt).not.toHaveBeenCalled();
  });

  it("maps unavailable and service failures without exposing database details", async () => {
    mocks.submitStudentQuestAttempt.mockResolvedValueOnce(null);
    const unavailable = await POST(request(submission), context());
    expect(unavailable.status).toBe(404);
    await expect(unavailable.json()).resolves.toEqual({ error: "Попытка недоступна" });

    mocks.submitStudentQuestAttempt.mockRejectedValueOnce(new StudentAttemptServiceError("private detail"));
    const failure = await POST(request(submission), context());
    expect(failure.status).toBe(500);
    await expect(failure.json()).resolves.toEqual({
      error: "Не удалось проверить ответы. Попробуйте еще раз.",
    });
  });
});
