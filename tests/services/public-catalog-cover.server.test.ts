import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  publicCatalogCoverPath,
  publicCatalogQuestId,
  validJpegBytes,
  validPngBytes,
  validWebpBytes,
} from "@/tests/fixtures/public-catalog";

const mocks = vi.hoisted(() => ({
  createCatalogMediaClient: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  download: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/catalog-media.server", () => ({
  createCatalogMediaClient: mocks.createCatalogMediaClient,
}));

import { getPublicCatalogCover } from "@/services/public-catalog-cover.server";

function configureResolver(objectPath: unknown, error: unknown = null) {
  mocks.rpc.mockResolvedValue({ data: error ? null : [{ object_path: objectPath }], error });
}

function configureDownload(data: Blob | null, error: unknown = null) {
  mocks.download.mockResolvedValue({ data, error });
  mocks.from.mockReturnValue({ download: mocks.download });
}

describe("public catalog cover service", () => {
  beforeEach(() => {
    mocks.createCatalogMediaClient.mockReturnValue({
      rpc: mocks.rpc,
      storage: { from: mocks.from },
    });
  });

  it("rejects malformed UUIDs before creating a privileged client", async () => {
    await expect(getPublicCatalogCover("not-a-uuid")).resolves.toEqual({
      status: "not_found",
    });
    expect(mocks.createCatalogMediaClient).not.toHaveBeenCalled();
  });

  it("maps resolver errors, multiple rows, and malformed resolver rows to safe failures", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "RAW_PROVIDER_ERROR" },
    });
    await expect(getPublicCatalogCover(publicCatalogQuestId)).resolves.toEqual({
      status: "internal_error",
    });

    mocks.rpc.mockResolvedValueOnce({
      data: [{ object_path: publicCatalogCoverPath }, { object_path: publicCatalogCoverPath }],
      error: null,
    });
    await expect(getPublicCatalogCover(publicCatalogQuestId)).resolves.toEqual({
      status: "internal_error",
    });

    mocks.rpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(getPublicCatalogCover(publicCatalogQuestId)).resolves.toEqual({
      status: "internal_error",
    });

    mocks.rpc.mockResolvedValueOnce({ data: [{}], error: null });
    const result = await getPublicCatalogCover(publicCatalogQuestId);
    expect(result).toEqual({ status: "internal_error" });
    expect(JSON.stringify(result)).not.toContain("RAW_PROVIDER_ERROR");
  });

  it("maps zero resolver rows and invalid canonical paths to not found", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(getPublicCatalogCover(publicCatalogQuestId)).resolves.toEqual({
      status: "not_found",
    });

    const invalidPaths = [
      "teachers/33333333-3333-4333-8333-333333333333/quests/22222222-2222-4222-8222-222222222222/cover/44444444-4444-4444-8444-444444444444.jpg",
      "teachers/33333333-3333-4333-8333-333333333333/quests/11111111-1111-4111-8111-111111111111/cover/nested/44444444-4444-4444-8444-444444444444.jpg",
      "teachers/33333333-3333-4333-8333-333333333333/quests/11111111-1111-4111-8111-111111111111/cover/../44444444-4444-4444-8444-444444444444.jpg",
      "teachers\\33333333-3333-4333-8333-333333333333\\quests\\11111111-1111-4111-8111-111111111111\\cover\\44444444-4444-4444-8444-444444444444.jpg",
      publicCatalogCoverPath.replace("/cover/", "%2fcover%2f"),
      publicCatalogCoverPath + "?query=1",
      publicCatalogCoverPath + "#fragment",
      publicCatalogCoverPath.replace(".jpg", ".svg"),
    ];

    for (const objectPath of invalidPaths) {
      configureResolver(objectPath);
      await expect(getPublicCatalogCover(publicCatalogQuestId)).resolves.toEqual({
        status: "not_found",
      });
    }
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("classifies storage download errors by numeric status without exposing paths", async () => {
    configureResolver(publicCatalogCoverPath);
    configureDownload(null, { status: 404, message: "RAW_STORAGE_404" });
    const notFoundResult = await getPublicCatalogCover(publicCatalogQuestId);
    expect(notFoundResult).toEqual({
      status: "not_found",
    });
    expect(JSON.stringify(notFoundResult)).not.toContain("RAW_STORAGE_404");

    configureResolver(publicCatalogCoverPath);
    configureDownload(null, { status: 500, message: "RAW_STORAGE_500" });
    const serverErrorResult = await getPublicCatalogCover(publicCatalogQuestId);
    expect(serverErrorResult).toEqual({
      status: "internal_error",
    });
    expect(JSON.stringify(serverErrorResult)).not.toContain("RAW_STORAGE_500");

    configureResolver(publicCatalogCoverPath);
    configureDownload(null, { message: "RAW_STORAGE_NO_STATUS" });
    const missingStatusResult = await getPublicCatalogCover(publicCatalogQuestId);
    expect(missingStatusResult).toEqual({
      status: "internal_error",
    });
    expect(JSON.stringify(missingStatusResult)).not.toContain("RAW_STORAGE_NO_STATUS");

    configureResolver(publicCatalogCoverPath);
    configureDownload(null, { status: "404", message: "RAW_STORAGE_STRING_STATUS" });
    const result = await getPublicCatalogCover(publicCatalogQuestId);
    expect(result).toEqual({ status: "internal_error" });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(publicCatalogCoverPath);
    expect(serialized).not.toContain("RAW_STORAGE_STRING_STATUS");
  });

  it("fails closed for falsy malformed storage errors before serving media", async () => {
    configureResolver(publicCatalogCoverPath);
    configureDownload(new Blob([validJpegBytes]), false);
    const falseErrorResult = await getPublicCatalogCover(publicCatalogQuestId);
    expect(falseErrorResult).toEqual({ status: "internal_error" });
    expect(falseErrorResult).not.toHaveProperty("bytes");
    expect(JSON.stringify(falseErrorResult)).not.toContain(publicCatalogCoverPath);

    configureResolver(publicCatalogCoverPath);
    mocks.download.mockResolvedValue({
      data: new Blob([validJpegBytes]),
      error: undefined,
    });
    const undefinedErrorResult = await getPublicCatalogCover(publicCatalogQuestId);
    expect(undefinedErrorResult).toEqual({ status: "internal_error" });
    expect(undefinedErrorResult).not.toHaveProperty("bytes");
    expect(JSON.stringify(undefinedErrorResult)).not.toContain(publicCatalogCoverPath);
  });

  it("maps invalid blobs to not found without exposing paths", async () => {
    configureResolver(publicCatalogCoverPath);
    configureDownload(new Blob([]));
    await expect(getPublicCatalogCover(publicCatalogQuestId)).resolves.toEqual({
      status: "not_found",
    });

    configureResolver(publicCatalogCoverPath);
    configureDownload(new Blob(["x".repeat(5 * 1024 * 1024 + 1)]));
    const result = await getPublicCatalogCover(publicCatalogQuestId);
    expect(result).toEqual({ status: "not_found" });
    expect(JSON.stringify(result)).not.toContain(publicCatalogCoverPath);
  });

  it("rejects extension and magic-byte mismatches", async () => {
    configureResolver(publicCatalogCoverPath);
    configureDownload(new Blob([validPngBytes]));
    await expect(getPublicCatalogCover(publicCatalogQuestId)).resolves.toEqual({
      status: "not_found",
    });

    configureResolver(publicCatalogCoverPath);
    configureDownload(new Blob([validJpegBytes], { type: "image/png" }));
    await expect(getPublicCatalogCover(publicCatalogQuestId)).resolves.toEqual({
      status: "not_found",
    });
  });

  it("returns validated JPEG, PNG, and WebP bytes", async () => {
    const cases = [
      { path: publicCatalogCoverPath, bytes: validJpegBytes, contentType: "image/jpeg" },
      { path: publicCatalogCoverPath.replace(".jpg", ".png"), bytes: validPngBytes, contentType: "image/png" },
      { path: publicCatalogCoverPath.replace(".jpg", ".webp"), bytes: validWebpBytes, contentType: "image/webp" },
    ] as const;

    for (const testCase of cases) {
      configureResolver(testCase.path);
      configureDownload(new Blob([testCase.bytes]));
      await expect(getPublicCatalogCover(publicCatalogQuestId)).resolves.toMatchObject({
        status: "success",
        bytes: testCase.bytes,
        contentType: testCase.contentType,
        contentLength: testCase.bytes.byteLength,
      });
    }

    expect(mocks.rpc).toHaveBeenLastCalledWith("resolve_public_catalog_cover", {
      p_quest_id: publicCatalogQuestId,
    });
    expect(mocks.from).toHaveBeenCalledWith("quest-images");
  });
});
