import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) =>
    createElement("a", props, children),
}));

import QuestWorkspaceNav from "@/components/dashboard/QuestWorkspaceNav";

describe("QuestWorkspaceNav", () => {
  it("includes Results as the single teacher workspace entry", () => {
    const questId = "11111111-1111-4111-8111-111111111111";
    const markup = renderToStaticMarkup(
      createElement(QuestWorkspaceNav, { questId, active: "results" })
    );

    expect(markup).toContain(`/dashboard/quests/${questId}/results`);
    expect(markup).toContain("\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b");
  });
});
