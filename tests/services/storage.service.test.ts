import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isSessionExpiredResponse: vi.fn(),
  redirectToSessionExpiredLogin: vi.fn(),
}));

vi.mock("@/lib/auth/session-expired.client", () => ({
  isSessionExpiredResponse: mocks.isSessionExpiredResponse,
  redirectToSessionExpiredLogin: mocks.redirectToSessionExpiredLogin,
  SESSION_EXPIRED_MESSAGE: "Session expired.",
}));

import { removeQuestImage, uploadQuestImage } from "@/services/storage.service";

describe("task image client requests", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends the client-held expected image URL with upload and delete requests", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ imageUrl: "https://example.test/new.png" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    mocks.isSessionExpiredResponse.mockReturnValue(false);

    const file = new File(["image"], "image.png", { type: "image/png" });
    const expectedImageUrl = "https://example.test/current.png";

    await expect(
      uploadQuestImage("quest-id", "task-id", file, expectedImageUrl)
    ).resolves.toMatchObject({ imageUrl: "https://example.test/new.png", error: null });
    await expect(
      removeQuestImage("quest-id", "task-id", expectedImageUrl)
    ).resolves.toMatchObject({ error: null });

    const uploadInit = fetchMock.mock.calls[0][1] as RequestInit;
    expect(uploadInit.method).toBe("POST");
    expect((uploadInit.body as FormData).get("expectedImageUrl")).toBe(expectedImageUrl);

    const deleteInit = fetchMock.mock.calls[1][1] as RequestInit;
    expect(deleteInit.method).toBe("DELETE");
    expect(JSON.parse(deleteInit.body as string)).toEqual({ expectedImageUrl });
  });
});
