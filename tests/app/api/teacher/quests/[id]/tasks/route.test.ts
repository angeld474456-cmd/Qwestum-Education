import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const taskId = "22222222-2222-4222-8222-222222222222";
const mocks = vi.hoisted(() => ({ createOwnedQuestTask: vi.fn() }));

vi.mock("@/services/teacher-task-creation.server", () => ({
  createOwnedQuestTask: mocks.createOwnedQuestTask,
}));

import { POST } from "@/app/api/teacher/quests/[id]/tasks/route";

const context = { params: Promise.resolve({ id: questId }) };
const validTask = {
  id: taskId,
  quest_id: questId,
  title: "Task",
  description: "Description",
  answer: "Answer",
  hint: "Hint",
  image_url: null,
  video_url: "",
  audio_url: "",
  content: null,
  points: 1,
  task_type: "text",
  sort_order: 1,
};

function request(body: unknown) {
  return new Request("http://example.test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    title: "Task",
    description: "Description",
    answer: "Answer",
    hint: "Hint",
    points: 1,
    task_type: "text",
    ...overrides,
  };
}

describe("teacher task creation route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps text, single-choice, and multiple-choice requests on the existing contract", async () => {
    const cases = [
      payload(),
      payload({ task_type: "single_choice" }),
      payload({
        task_type: "multiple_choice",
        content: {
          options: [
            { id: "option-a", text: "A" },
            { id: "option-b", text: "B" },
          ],
          correctOptionIds: ["option-a", "option-b"],
        },
      }),
    ];

    for (const body of cases) {
      mocks.createOwnedQuestTask.mockResolvedValue({ status: "ok", task: validTask });
      const response = await POST(request(body), context);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ task: validTask });
    }

    expect(mocks.createOwnedQuestTask).toHaveBeenCalledTimes(3);
  });

  it("rejects malformed requests before calling the RPC service", async () => {
    const invalidRequests = [
      [request(payload()), { params: Promise.resolve({ id: "not-a-uuid" }) }, 404],
      [request("not-json"), context, 400],
      [request(payload({ title: "   " })), context, 400],
      [request(payload({ points: 0 })), context, 400],
      [request(payload({ task_type: "unsupported" })), context, 400],
      [request(payload({ task_type: "multiple_choice", content: { options: [] } })), context, 400],
    ] as const;

    for (const [input, routeContext, expectedStatus] of invalidRequests) {
      const response = await POST(input, routeContext);
      expect(response.status).toBe(expectedStatus);
    }

    expect(mocks.createOwnedQuestTask).not.toHaveBeenCalled();
  });

  it("maps service outcomes to fixed safe responses", async () => {
    const cases = [
      ["unauthorized", 401, { error: "Unauthorized." }],
      ["not_found", 404, { error: "Quest not found." }],
      ["task_limit_reached", 409, { error: "Task limit reached." }],
      ["error", 500, { error: "Unable to create task." }],
    ] as const;

    for (const [status, statusCode, body] of cases) {
      mocks.createOwnedQuestTask.mockResolvedValue({ status });
      const response = await POST(request(payload()), context);
      expect(response.status).toBe(statusCode);
      await expect(response.json()).resolves.toEqual(body);
    }
  });
});
