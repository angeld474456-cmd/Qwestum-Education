import { describe, expect, it, vi } from "vitest";

import {
  publicCatalogQuestId,
  validJpegBytes,
  validPngBytes,
  validWebpBytes,
} from "@/tests/fixtures/public-catalog";

const mocks = vi.hoisted(() => ({
  getPublicCatalogCover: vi.fn(),
}));

vi.mock("@/services/public-catalog-cover.server", () => ({
  getPublicCatalogCover: mocks.getPublicCatalogCover,
}));

import { GET } from "@/app/api/public/quests/[id]/cover/route";

function context(id = publicCatalogQuestId) {
  return { params: Promise.resolve({ id }) };
}

describe("public catalog cover route", () => {
  it("returns 404 for malformed IDs without calling the service", async () => {
    const response = await GET(new Request("http://example.test"), context("bad-id"));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Cover not found" });
    expect(mocks.getPublicCatalogCover).not.toHaveBeenCalled();
  });

  it("maps unavailable and invalid media to the same safe 404 response", async () => {
    mocks.getPublicCatalogCover.mockResolvedValue({ status: "not_found" });
    const response = await GET(new Request("http://example.test"), context());
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ error: "Cover not found" });
  });

  it("maps internal failures to a generic 500 response", async () => {
    mocks.getPublicCatalogCover.mockResolvedValue({ status: "internal_error" });
    const response = await GET(new Request("http://example.test"), context());
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "Unable to load cover" });
    expect(JSON.stringify(body)).not.toMatch(/path|provider|storage|RAW_/);
  });

  it.each([
    ["image/jpeg", validJpegBytes],
    ["image/png", validPngBytes],
    ["image/webp", validWebpBytes],
  ] as const)("streams validated %s bytes with hardened headers", async (contentType, bytes) => {
    mocks.getPublicCatalogCover.mockResolvedValue({
      status: "success",
      bytes,
      contentType,
      contentLength: bytes.byteLength,
    });

    const response = await GET(new Request("http://example.test"), context());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(contentType);
    expect(response.headers.get("content-length")).toBe(bytes.byteLength.toString());
    expect(response.headers.get("cache-control")).toBe("private, max-age=60, must-revalidate");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-disposition")).toBe("inline");
    expect(response.headers.get("location")).toBeNull();
    await expect(response.arrayBuffer()).resolves.toEqual(bytes.buffer);
  });
});
