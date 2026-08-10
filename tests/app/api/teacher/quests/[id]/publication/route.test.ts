import { beforeEach, describe, expect, it, vi } from "vitest";

import { publicationDtoFixtures, questId } from "@/tests/fixtures/teacher-publication";

const mocks = vi.hoisted(() => ({ setPublication: vi.fn() }));

vi.mock("@/services/teacher-publication.server", () => ({
  setOwnedQuestPublicationState: mocks.setPublication,
}));

import { POST } from "@/app/api/teacher/quests/[id]/publication/route";

const context = { params: Promise.resolve({ id: questId }) };
const request = (body?: BodyInit | null) => new Request("http://example.test", {
  method: "POST",
  headers: body === undefined ? undefined : { "content-type": "application/json" },
  body,
});

async function expectInvalid(body: BodyInit | null | undefined) {
  const response = await POST(request(body), context);
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({ error: "Invalid publication action." });
  expect(mocks.setPublication).not.toHaveBeenCalled();
}

describe("publication route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with the exact published DTO", async () => {
    mocks.setPublication.mockResolvedValue({ status: "ok", publication: publicationDtoFixtures.published });
    const response = await POST(request(JSON.stringify({ action: "publish" })), context);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ publication: publicationDtoFixtures.published });
    expect(mocks.setPublication).toHaveBeenCalledTimes(1);
    expect(mocks.setPublication).toHaveBeenCalledWith(questId, "publish");
  });

  it("returns 200 with the exact already_published DTO", async () => {
    mocks.setPublication.mockResolvedValue({ status: "ok", publication: publicationDtoFixtures.alreadyPublished });
    const response = await POST(request(JSON.stringify({ action: "publish" })), context);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ publication: publicationDtoFixtures.alreadyPublished });
  });

  it("returns 200 with the exact unpublished DTO", async () => {
    mocks.setPublication.mockResolvedValue({ status: "ok", publication: publicationDtoFixtures.unpublished });
    const response = await POST(request(JSON.stringify({ action: "unpublish" })), context);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ publication: publicationDtoFixtures.unpublished });
  });

  it("returns 200 with the exact already_draft DTO", async () => {
    mocks.setPublication.mockResolvedValue({ status: "ok", publication: publicationDtoFixtures.alreadyDraft });
    const response = await POST(request(JSON.stringify({ action: "unpublish" })), context);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ publication: publicationDtoFixtures.alreadyDraft });
  });

  it("rejects malformed JSON", async () => expectInvalid("{"));
  it("rejects an empty body", async () => expectInvalid(undefined));
  it("rejects null", async () => expectInvalid("null"));
  it("rejects an array", async () => expectInvalid("[]"));
  it("rejects a primitive", async () => expectInvalid('"publish"'));
  it("rejects a missing action", async () => expectInvalid("{}"));
  it("rejects an unsupported action", async () => expectInvalid('{"action":"archive"}'));
  it("rejects an extra field", async () => expectInvalid('{"action":"publish","extra":true}'));

  it("returns owner-safe 404 for an invalid UUID without calling the service", async () => {
    const response = await POST(request(JSON.stringify({ action: "publish" })), { params: Promise.resolve({ id: "not-a-uuid" }) });
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Quest not found." });
    expect(mocks.setPublication).not.toHaveBeenCalled();
  });

  it("returns 401 for an unauthorized service result", async () => {
    mocks.setPublication.mockResolvedValue({ status: "unauthorized" });
    const response = await POST(request(JSON.stringify({ action: "publish" })), context);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
  });

  it("returns 404 for an owner-safe not_found service result", async () => {
    mocks.setPublication.mockResolvedValue({ status: "not_found" });
    const response = await POST(request(JSON.stringify({ action: "publish" })), context);
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Quest not found." });
  });

  it("returns 409 for a blocked service result", async () => {
    mocks.setPublication.mockResolvedValue({ status: "blocked" });
    const response = await POST(request(JSON.stringify({ action: "publish" })), context);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Quest is not ready for publication." });
  });

  it("returns 500 for an error service result", async () => {
    mocks.setPublication.mockResolvedValue({ status: "error" });
    const response = await POST(request(JSON.stringify({ action: "publish" })), context);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "Unable to update publication state." });
    expect(JSON.stringify(body)).not.toMatch(/content|correctOptionId|author_id|owner|RAW_DB_MESSAGE|RAW_DB_DETAIL/);
  });

  it("uses async route params and returns no sensitive success fields", async () => {
    mocks.setPublication.mockResolvedValue({ status: "ok", publication: publicationDtoFixtures.published });
    const response = await POST(request(JSON.stringify({ action: "publish" })), { params: Promise.resolve({ id: questId }) });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.setPublication).toHaveBeenCalledTimes(1);
    expect(mocks.setPublication).toHaveBeenCalledWith(questId, "publish");
    expect(JSON.stringify(body)).not.toMatch(/content|correctOptionId|author_id|owner|RAW_DB_MESSAGE|RAW_DB_DETAIL/);
  });
});
