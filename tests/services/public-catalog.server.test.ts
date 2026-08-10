import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createPublicCatalogRpcRow,
  publicCatalogQuestId,
} from "@/tests/fixtures/public-catalog";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import {
  getPublicCatalogQuest,
  listPublicCatalogQuests,
} from "@/services/public-catalog.server";

describe("public catalog server service", () => {
  beforeEach(() => {
    mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
  });

  it("maps has_cover to an allowlisted same-origin cover URL for list results", async () => {
    mocks.rpc.mockResolvedValue({
      data: [createPublicCatalogRpcRow(true)],
      error: null,
    });

    const result = await listPublicCatalogQuests({
      search: null,
      subject: null,
      grade: null,
      difficulty: null,
      offset: 0,
    });

    expect(result.quests).toEqual([
      {
        id: publicCatalogQuestId,
        title: "Public catalog quest",
        description: "Safe public description",
        subjectName: "Mathematics",
        difficulty: 2,
        languageCode: "en",
        gradeMin: 5,
        gradeMax: 7,
        estimatedDurationMinutes: 30,
        category: "Practice",
        tags: ["algebra", "logic"],
        coverUrl: "/api/public/quests/" + publicCatalogQuestId + "/cover",
        createdAt: "2026-07-30T00:00:00.000Z",
      },
    ]);
    expect(JSON.stringify(result)).not.toMatch(
      /has_cover|cover_image_path|object_path|author_id|quest-images|44444444/
    );
  });

  it("maps false has_cover to null and fails closed for malformed rows", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [createPublicCatalogRpcRow(false)],
      error: null,
    });
    await expect(getPublicCatalogQuest(publicCatalogQuestId)).resolves.toMatchObject({
      id: publicCatalogQuestId,
      coverUrl: null,
    });

    mocks.rpc.mockResolvedValueOnce({
      data: [{ ...createPublicCatalogRpcRow(true), has_cover: "true" }],
      error: null,
    });
    await expect(getPublicCatalogQuest(publicCatalogQuestId)).resolves.toBeNull();
  });
});
