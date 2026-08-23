import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) =>
    createElement("a", props, children),
}));

import QuestWorkspaceNav from "@/components/dashboard/QuestWorkspaceNav";

const questId = "11111111-1111-4111-8111-111111111111";

describe("QuestWorkspaceNav", () => {
  it("keeps the library link separate and preserves every workspace route", () => {
    const markup = renderToStaticMarkup(
      createElement(QuestWorkspaceNav, { questId, active: "tasks" })
    );

    expect(markup).toContain('href="/dashboard/quests"');
    expect(markup).toContain("К библиотеке");

    for (const [path, label] of [
      ["settings", "Настройки"],
      ["tasks", "Задания"],
      ["preview", "Предпросмотр"],
      ["play", "Тестирование"],
      ["results", "Результаты"],
    ]) {
      expect(markup).toContain(`href="/dashboard/quests/${questId}/${path}"`);
      expect(markup).toContain(label);
    }

    expect(markup).toContain('aria-label="Разделы квеста"');
  });

  it("marks only the active tab as the current page with the violet active treatment", () => {
    const markup = renderToStaticMarkup(
      createElement(QuestWorkspaceNav, { questId, active: "results" })
    );

    expect(markup).toContain(
      `href="/dashboard/quests/${questId}/results" class="group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-xl border border-violet-100/50 bg-gradient-to-br from-[#14244F] via-[#2A2160] to-[#3E175F]`
    );
    expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
    expect(markup).toContain("hover:from-[#1B3067]");
    expect(markup).toContain("focus-visible:from-[#1B3067]");
    expect(markup).toContain("hover:before:bg-white/50");
    expect(markup).toContain(
      `href="/dashboard/quests/${questId}/tasks" class="group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-xl border border-violet-200/25 bg-gradient-to-br from-[#172553] via-[#2B2470] to-[#4A1E78]`
    );
  });

  it("keeps icon micro-interactions scoped to hover and keyboard focus", () => {
    const markup = renderToStaticMarkup(
      createElement(QuestWorkspaceNav, { questId, active: "settings" })
    );

    for (const motionClass of [
      "group-hover:rotate-45",
      "group-hover:scale-105",
      "group-hover:scale-130",
      "group-hover:-rotate-45",
      "group-hover:-translate-y-0.5",
      "group-focus-visible:rotate-45",
      "group-focus-visible:scale-105",
      "group-focus-visible:scale-130",
      "group-focus-visible:-rotate-45",
      "group-focus-visible:-translate-y-0.5",
      "motion-reduce:transition-none",
    ]) {
      expect(markup).toContain(motionClass);
    }
  });
});
