import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const duplicateId = "22222222-2222-4222-8222-222222222222";
const mocks = vi.hoisted(() => ({ duplicateOwnedQuest: vi.fn() }));

vi.mock("@/services/teacher-quest-duplication.server", () => ({
  duplicateOwnedQuest: mocks.duplicateOwnedQuest,
}));

import { POST } from "@/app/api/teacher/quests/[id]/duplicate/route";

const context = { params: Promise.resolve({ id: questId }) };

describe("quest duplication route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 for a malformed UUID without calling the service", async () => {
    const response = await POST(new Request("http://example.test"), {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid quest id." });
    expect(mocks.duplicateOwnedQuest).not.toHaveBeenCalled();
  });

  it("returns only the new quest id on success", async () => {
    mocks.duplicateOwnedQuest.mockResolvedValue({ status: "ok", id: duplicateId });

    const response = await POST(new Request("http://example.test"), context);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ id: duplicateId });
    expect(Object.keys(body)).toEqual(["id"]);
    expect(mocks.duplicateOwnedQuest).toHaveBeenCalledTimes(1);
    expect(mocks.duplicateOwnedQuest).toHaveBeenCalledWith(questId);
  });

  it("maps safe service failures without exposing database detail", async () => {
    const cases = [
      ["unauthorized", 401, { error: "Unauthorized." }],
      ["not_found", 404, { error: "Quest not found." }],
      ["error", 500, { error: "Unable to duplicate quest." }],
    ] as const;

    for (const [status, code, expectedBody] of cases) {
      mocks.duplicateOwnedQuest.mockResolvedValue({ status });
      const response = await POST(new Request("http://example.test"), context);
      expect(response.status).toBe(code);
      const body = await response.json();
      expect(body).toEqual(expectedBody);
      expect(JSON.stringify(body)).not.toMatch(/RAW_DATABASE|author_id|owner|content|answer/);
    }
  });
});
