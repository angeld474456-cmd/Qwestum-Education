import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) =>
    createElement("a", props, children),
}));

vi.mock("@/components/dashboard/QuestPublicationReadiness", () => ({
  default: () => createElement("div", null, "Publication readiness"),
}));

import QuestSettingsForm from "@/components/dashboard/QuestSettingsForm";

describe("QuestSettingsForm", () => {
  it("renders saved optional mission textareas with the narrative limits", () => {
    const markup = renderToStaticMarkup(
      createElement(QuestSettingsForm, {
        quest: {
          id: "11111111-1111-4111-8111-111111111111",
          title: "Quest",
          description: null,
          mission_intro: "Mission briefing",
          mission_outro: "Mission complete",
          subject_id: null,
          language_code: "ru",
          category: null,
          tags: [],
          difficulty: 1,
          is_public: false,
          grade_min: null,
          grade_max: null,
          estimated_duration_minutes: null,
        },
        subjects: [],
        taskCount: 1,
      })
    );

    expect(markup).toContain("Вступление миссии");
    expect(markup).toContain("Финал миссии");
    expect(markup).toContain('id="quest-mission-intro"');
    expect(markup).toContain('id="quest-mission-outro"');
    expect(markup).toContain('maxLength="4000"');
    expect(markup).toContain("Mission briefing");
    expect(markup).toContain("Mission complete");
  });
});
