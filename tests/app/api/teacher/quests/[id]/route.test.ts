import { beforeEach, describe, expect, it, vi } from "vitest";

const questId = "11111111-1111-4111-8111-111111111111";
const ownerId = "22222222-2222-4222-8222-222222222222";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createClient: vi.fn(),
  deleteOwnedQuest: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/services/teacher-quest-deletion.server", () => ({
  deleteOwnedQuest: mocks.deleteOwnedQuest,
}));

import { DELETE, PATCH } from "@/app/api/teacher/quests/[id]/route";

const context = { params: Promise.resolve({ id: questId }) };
const metadataBody = {
  title: "Updated quest",
  description: "Updated description",
  difficulty: 2,
};
const publishedQuest = {
  id: questId,
  title: "Updated quest",
  description: "Updated description",
  subject_id: null,
  language_code: null,
  category: null,
  tags: [],
  difficulty: 2,
  is_public: true,
  grade_min: null,
  grade_max: null,
  estimated_duration_minutes: null,
};

function request(body: BodyInit) {
  return new Request("http://example.test", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body,
  });
}

function configureClient(options?: {
  user?: { id: string } | null;
  owner?: Record<string, unknown> | null;
  ownerError?: unknown;
  update?: Record<string, unknown> | null;
  updateError?: unknown;
}) {
  const ownerQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  const updateQuery = {
    update: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
    maybeSingle: vi.fn(),
  };
  ownerQuery.select.mockReturnValue(ownerQuery);
  ownerQuery.eq.mockReturnValue(ownerQuery);
  ownerQuery.maybeSingle.mockResolvedValue({
    data: options?.owner === undefined
      ? { id: questId, grade_min: null, grade_max: null }
      : options.owner,
    error: options?.ownerError ?? null,
  });
  updateQuery.update.mockReturnValue(updateQuery);
  updateQuery.eq.mockReturnValue(updateQuery);
  updateQuery.select.mockReturnValue(updateQuery);
  updateQuery.maybeSingle.mockResolvedValue({
    data: options?.update === undefined ? publishedQuest : options.update,
    error: options?.updateError ?? null,
  });
  mocks.auth.mockResolvedValue({ data: { user: options?.user === undefined ? { id: ownerId } : options.user } });
  mocks.from.mockImplementationOnce(() => ownerQuery).mockImplementationOnce(() => updateQuery);
  mocks.createClient.mockResolvedValue({ auth: { getUser: mocks.auth }, from: mocks.from, rpc: mocks.rpc });
  return { ownerQuery, updateQuery };
}

describe("quest settings PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("updates valid metadata without is_public and preserves the published value", async () => {
    const { updateQuery } = configureClient();
    const response = await PATCH(request(JSON.stringify(metadataBody)), context);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ quest: publishedQuest });
    expect(updateQuery.update).toHaveBeenCalledWith({
      title: "Updated quest",
      description: "Updated description",
      difficulty: 2,
    });
    expect(updateQuery.update.mock.calls[0][0]).not.toHaveProperty("is_public");
    expect(mocks.from).toHaveBeenNthCalledWith(1, "quests");
    expect(mocks.from).toHaveBeenNthCalledWith(2, "quests");
    expect(mocks.from).not.toHaveBeenCalledWith("quest_tasks");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a body containing only is_public before authentication", async () => {
    const response = await PATCH(request(JSON.stringify({ is_public: true })), context);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Publication state must be changed through the publication action." });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects is_public together with otherwise valid settings", async () => {
    const response = await PATCH(request(JSON.stringify({ ...metadataBody, is_public: false })), context);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Publication state must be changed through the publication action." });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a non-boolean is_public before every query", async () => {
    const response = await PATCH(request(JSON.stringify({ ...metadataBody, is_public: "true" })), context);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Publication state must be changed through the publication action." });
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("keeps malformed JSON safe", async () => {
    const response = await PATCH(request("{"), context);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid JSON payload." });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("returns owner-safe not_found for an invalid UUID", async () => {
    const response = await PATCH(request(JSON.stringify(metadataBody)), { params: Promise.resolve({ id: "not-a-uuid" }) });
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Quest not found." });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("returns unauthorized without querying quests", async () => {
    configureClient({ user: null });
    const response = await PATCH(request(JSON.stringify(metadataBody)), context);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("returns owner-safe not_found when the quest is absent", async () => {
    configureClient({ owner: null });
    const response = await PATCH(request(JSON.stringify(metadataBody)), context);
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Quest not found." });
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledWith("quests");
  });

  it("returns a generic error without raw owner-query details", async () => {
    configureClient({ ownerError: { message: "RAW_DB_MESSAGE", details: "RAW_DB_DETAIL" } });
    const response = await PATCH(request(JSON.stringify(metadataBody)), context);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "Unable to save quest settings." });
    expect(JSON.stringify(body)).not.toMatch(/RAW_DB_MESSAGE|RAW_DB_DETAIL/);
  });

  it("returns a generic error without raw update details", async () => {
    configureClient({ update: null, updateError: { message: "RAW_DB_MESSAGE", details: "RAW_DB_DETAIL" } });
    const response = await PATCH(request(JSON.stringify(metadataBody)), context);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "Unable to save quest settings." });
    expect(JSON.stringify(body)).not.toMatch(/RAW_DB_MESSAGE|RAW_DB_DETAIL/);
  });
});

describe("quest deletion DELETE", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 for a malformed UUID without calling the deletion service", async () => {
    const response = await DELETE(new Request("http://example.test"), {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid quest id." });
    expect(mocks.deleteOwnedQuest).not.toHaveBeenCalled();
  });

  it("returns 204 after one successful deletion service call", async () => {
    mocks.deleteOwnedQuest.mockResolvedValue({ status: "ok" });

    const response = await DELETE(new Request("http://example.test"), context);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(mocks.deleteOwnedQuest).toHaveBeenCalledTimes(1);
    expect(mocks.deleteOwnedQuest).toHaveBeenCalledWith(questId);
  });

  it("maps safe deletion failures without exposing raw details", async () => {
    const cases = [
      ["unauthorized", 401, { error: "Unauthorized." }],
      ["not_found", 404, { error: "Quest not found." }],
      ["error", 500, { error: "Unable to delete quest." }],
    ] as const;

    for (const [status, code, expectedBody] of cases) {
      mocks.deleteOwnedQuest.mockResolvedValue({ status });
      const response = await DELETE(new Request("http://example.test"), context);
      expect(response.status).toBe(code);
      const body = await response.json();
      expect(body).toEqual(expectedBody);
      expect(JSON.stringify(body)).not.toMatch(/RAW_DATABASE|author_id|owner|image_url/);
    }
  });
});
