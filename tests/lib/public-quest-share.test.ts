import { describe, expect, it, vi } from "vitest";

import {
  copyPublicQuestLink,
  getPublicQuestSharePath,
  shouldShowPublicQuestShare,
} from "@/lib/public-quest-share";

const questId = "11111111-1111-4111-8111-111111111111";

describe("public quest sharing", () => {
  it("uses the canonical public detail route", () => {
    expect(getPublicQuestSharePath(questId)).toBe(`/catalog/${questId}`);
    expect(getPublicQuestSharePath("not-a-quest-id")).toBeNull();
  });

  it("reports copied after the clipboard accepts the canonical detail URL", async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };

    await expect(
      copyPublicQuestLink(questId, "https://qwestum.example", clipboard)
    ).resolves.toBe("copied");

    expect(clipboard.writeText).toHaveBeenCalledWith(
      `https://qwestum.example/catalog/${questId}`
    );
  });

  it("reports a safe failure when clipboard copy fails", async () => {
    const clipboard = { writeText: vi.fn().mockRejectedValue(new Error("failed")) };

    await expect(
      copyPublicQuestLink(questId, "https://qwestum.example", clipboard)
    ).resolves.toBe("failed");
  });

  it("exposes sharing only for confirmed Published state", () => {
    expect(shouldShowPublicQuestShare(false)).toBe(false);
    expect(shouldShowPublicQuestShare(true)).toBe(true);
  });
});
