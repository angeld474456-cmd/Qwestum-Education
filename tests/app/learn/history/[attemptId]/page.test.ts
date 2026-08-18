import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getStudentAttemptHistoryDetail: vi.fn(),
  result: vi.fn(() => null),
}));

vi.mock("@/services/student-attempt-history.server", () => ({
  getStudentAttemptHistoryDetail: mocks.getStudentAttemptHistoryDetail,
}));
vi.mock("@/components/learn/LearnerAttemptResult", () => ({ default: mocks.result }));

import LearnerAttemptHistoryPage from "@/app/learn/history/[attemptId]/page";

const attemptId = "b5f1f56a-6014-4d33-8c49-87b10a78f76e";
const attempt = { attemptId, questTitle: "Snapshot title", tasks: [] };

describe("learner history detail page", () => {
  it("renders only the owned immutable detail returned by the history service", async () => {
    mocks.getStudentAttemptHistoryDetail.mockResolvedValue(attempt);

    const page = await LearnerAttemptHistoryPage({ params: Promise.resolve({ attemptId }) });

    expect(mocks.getStudentAttemptHistoryDetail).toHaveBeenCalledWith(attemptId);
    expect(page.type).toBe(mocks.result);
    expect(page.props.attempt).toBe(attempt);
  });

  it("uses the same unavailable boundary for malformed or missing attempts", async () => {
    mocks.getStudentAttemptHistoryDetail.mockResolvedValue(null);
    const page = await LearnerAttemptHistoryPage({ params: Promise.resolve({ attemptId: "invalid" }) });

    expect(page.type).not.toBe(mocks.result);
    expect(renderToStaticMarkup(page)).toContain("Результат недоступен");
  });
});
