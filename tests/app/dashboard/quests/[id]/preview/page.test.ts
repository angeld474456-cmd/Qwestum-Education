import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOwnedQuest: vi.fn(),
  getOwnedQuestTasks: vi.fn(),
  getTeacherSubjects: vi.fn(),
}));

vi.mock("@/services/teacher-quest.server", () => ({
  getOwnedQuest: mocks.getOwnedQuest,
  getOwnedQuestTasks: mocks.getOwnedQuestTasks,
}));
vi.mock("@/services/subject.server", () => ({
  getTeacherSubjects: mocks.getTeacherSubjects,
}));
vi.mock("@/lib/storage/quest-cover.server", () => ({
  getSafeQuestCoverImagePublicUrl: vi.fn(() => null),
}));

import TeacherQuestPreviewPage from "@/app/dashboard/quests/[id]/preview/page";

const questId = "bba3c463-5fa5-4060-b8f5-833f8692c879";
const sequenceTaskId = "b5184b19-f702-4878-8240-4e05067ac67b";
const savedItemIds = [
  "1508f60c-66b6-468e-aaf6-e040c4917793",
  "7579bacc-9d5b-4f5e-9da6-f1132d499477",
  "88f01745-0891-4d96-b30f-584387387097",
  "409e103a-f10a-4a41-a46b-35d2a2bb6771",
  "2013fb63-c36c-4772-ae87-5b76fe3fb853",
];

const savedSequenceContent = {
  items: savedItemIds.map((id, index) => ({
    id,
    text: `Элемент ${index + 1}`,
  })),
  correctOrder: savedItemIds,
};

function mockPreviewTask(content: Record<string, unknown>) {
  mocks.getOwnedQuest.mockResolvedValue({
    id: questId,
    title: "Тестовый квест",
    description: null,
    subject_id: null,
    language_code: null,
    cover_image_path: null,
    category: null,
    tags: [],
    grade_min: null,
    grade_max: null,
    estimated_duration_minutes: null,
    author_id: "11111111-1111-4111-8111-111111111111",
  });
  mocks.getTeacherSubjects.mockResolvedValue([]);
  mocks.getOwnedQuestTasks.mockResolvedValue([
    {
      id: sequenceTaskId,
      quest_id: questId,
      task_type: "sequence",
      title: "Расположите события",
      description: null,
      image_url: null,
      content,
      points: 10,
      sort_order: 0,
    },
  ]);
}

describe("TeacherQuestPreviewPage", () => {
  it("renders the validated persisted Sequence shape instead of treating it as corrupted", async () => {
    mockPreviewTask(savedSequenceContent);

    const page = await TeacherQuestPreviewPage({
      params: Promise.resolve({ id: questId }),
    });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain("Расположите события");
    expect(markup).toContain("Элемент 1");
    expect(markup).not.toContain("Последовательность задания повреждена");
  });

  it("keeps malformed persisted Sequence content fail-closed", async () => {
    mockPreviewTask({ ...savedSequenceContent, unexpected: true });

    const page = await TeacherQuestPreviewPage({
      params: Promise.resolve({ id: questId }),
    });

    expect(renderToStaticMarkup(page)).toContain(
      "Последовательность задания повреждена"
    );
  });
});
