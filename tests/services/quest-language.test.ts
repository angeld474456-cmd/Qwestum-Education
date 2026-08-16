import { describe, expect, it } from "vitest";

import {
  getQuestLanguageLabel,
  isQuestLanguageCode,
} from "@/services/quest-language";

describe("quest language labels", () => {
  it("maps supported language codes to Russian labels", () => {
    expect(getQuestLanguageLabel("ru")).toBe("Русский");
    expect(getQuestLanguageLabel("kk")).toBe("Казахский");
    expect(getQuestLanguageLabel("en")).toBe("Английский");
  });

  it("returns null for null and unsupported language codes", () => {
    expect(getQuestLanguageLabel(null)).toBeNull();
    expect(getQuestLanguageLabel("de")).toBeNull();
  });

  it("recognizes only supported language codes", () => {
    expect(isQuestLanguageCode("ru")).toBe(true);
    expect(isQuestLanguageCode("kk")).toBe(true);
    expect(isQuestLanguageCode("en")).toBe(true);
    expect(isQuestLanguageCode(null)).toBe(false);
    expect(isQuestLanguageCode("de")).toBe(false);
  });
});
