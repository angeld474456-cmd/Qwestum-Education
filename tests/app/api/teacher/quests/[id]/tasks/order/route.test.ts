import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const firstTaskId = "22222222-2222-4222-8222-222222222222";
const secondTaskId = "33333333-3333-4333-8333-333333333333";
const taskIds = [secondTaskId, firstTaskId];
const mocks = vi.hoisted(() => ({ reorderOwnedQuestTasks: vi.fn() }));

vi.mock("@/services/teacher-task-ordering.server", () => ({
  reorderOwnedQuestTasks: mocks.reorderOwnedQuestTasks,
}));

import { PATCH } from "@/app/api/teacher/quests/[id]/tasks/order/route";

const context = { params: Promise.resolve({ id: questId }) };

function request(body: unknown, contentType = "application/json") {
  return new Request("http://example.test", {
    method: "PATCH",
    headers: { "content-type": contentType },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("teacher task ordering route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects malformed route ids and structural payloads before the service", async () => {
    const invalidRequests = [
      [request({ taskIds }), { params: Promise.resolve({ id: "not-a-uuid" }) }],
      [request({ taskIds }, "text/plain"), context],
      [request("not-json"), context],
      [request({}), context],
      [request({ taskIds: null }), context],
      [request({ taskIds: firstTaskId }), context],
      [request({ taskIds: {} }), context],
      [request({ taskIds: [] }), context],
      [request({ taskIds: Array.from({ length: 101 }, () => firstTaskId) }), context],
      [request({ taskIds: [firstTaskId, 1] }), context],
      [request({ taskIds: ["not-a-uuid"] }), context],
      [request({ taskIds: [firstTaskId, firstTaskId] }), context],
      [request({ taskIds, unexpected: true }), context],
    ] as const;

    for (const [input, routeContext] of invalidRequests) {
      const response = await PATCH(input, routeContext);
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "Invalid task order." });
    }

    expect(mocks.reorderOwnedQuestTasks).not.toHaveBeenCalled();
  });

  it("returns only the accepted task ids on success", async () => {
    mocks.reorderOwnedQuestTasks.mockResolvedValue({ status: "ok", taskIds });

    const response = await PATCH(request({ taskIds }), context);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ taskIds });
    expect(mocks.reorderOwnedQuestTasks).toHaveBeenCalledWith(questId, taskIds);
  });

  it("maps service failures to fixed, owner-safe responses", async () => {
    const cases = [
      ["unauthorized", 401, { error: "Unauthorized." }],
      ["not_found", 404, { error: "Unable to change task order. Refresh the page." }],
      ["error", 500, { error: "Unable to change task order. Refresh the page." }],
    ] as const;

    for (const [status, statusCode, body] of cases) {
      mocks.reorderOwnedQuestTasks.mockResolvedValue({ status });
      const response = await PATCH(request({ taskIds }), context);
      expect(response.status).toBe(statusCode);
      await expect(response.json()).resolves.toEqual(body);
    }
  });
});
