import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const mocks = vi.hoisted(() => ({ createOwnedQuest: vi.fn() }));

vi.mock("@/services/teacher-quest-creation.server", () => ({
  createOwnedQuest: mocks.createOwnedQuest,
}));

import { POST } from "@/app/api/teacher/quests/route";

function request(value: unknown) {
  return new Request("http://example.test/api/teacher/quests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof value === "string" ? value : JSON.stringify(value),
  });
}

describe("quest creation POST", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects malformed JSON", async () => {
    const response = await POST(request("{"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid JSON payload." });
    expect(mocks.createOwnedQuest).not.toHaveBeenCalled();
  });

  it.each([
    [{ description: "Description", difficulty: 1 }, "Title is required."],
    [{ title: "   ", description: "Description", difficulty: 1 }, "Title is required."],
    [{ title: "Quest", description: "Description", difficulty: 0 }, "Difficulty must be 1, 2, or 3."],
    [{ title: "Quest", description: "Description", difficulty: 4 }, "Difficulty must be 1, 2, or 3."],
    [{ title: "Quest", description: "Description", difficulty: "nope" }, "Difficulty must be 1, 2, or 3."],
  ])("rejects invalid payloads before the service", async (payload, message) => {
    const response = await POST(request(payload));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: message });
    expect(mocks.createOwnedQuest).not.toHaveBeenCalled();
  });

  it.each([1, 2, 3])("preserves valid difficulty %s and the exact success DTO", async (difficulty) => {
    mocks.createOwnedQuest.mockResolvedValue({ status: "ok", id: questId });
    const response = await POST(request({ title: " Quest ", description: " Description ", difficulty }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ quest: { id: questId } });
    expect(mocks.createOwnedQuest).toHaveBeenCalledOnce();
    expect(mocks.createOwnedQuest).toHaveBeenCalledWith({
      title: "Quest",
      description: "Description",
      difficulty,
    });
  });

  it("preserves absent and non-string descriptions as empty strings and ignores extra keys", async () => {
    mocks.createOwnedQuest.mockResolvedValue({ status: "ok", id: questId });

    await POST(request({ title: "Quest", difficulty: 1, ignored: "value" }));
    expect(mocks.createOwnedQuest).toHaveBeenLastCalledWith({
      title: "Quest",
      description: "",
      difficulty: 1,
    });

    await POST(request({ title: "Quest", description: null, difficulty: 1 }));
    expect(mocks.createOwnedQuest).toHaveBeenLastCalledWith({
      title: "Quest",
      description: "",
      difficulty: 1,
    });
  });

  it.each([
    ["unauthorized", 401, { error: "Unauthorized." }],
    ["invalid", 500, { error: "Unable to create quest." }],
    ["error", 500, { error: "Unable to create quest." }],
  ] as const)("maps the service %s outcome safely", async (status, code, expected) => {
    mocks.createOwnedQuest.mockResolvedValue({ status });
    const response = await POST(request({ title: "Quest", description: "Description", difficulty: 1 }));

    expect(response.status).toBe(code);
    await expect(response.json()).resolves.toEqual(expected);
    expect(mocks.createOwnedQuest).toHaveBeenCalledOnce();
  });
});
