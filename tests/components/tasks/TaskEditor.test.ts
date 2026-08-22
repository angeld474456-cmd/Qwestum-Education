import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/tasks/editor/TaskTypeRegistry", () => {
  const Editor = () => createElement("div", null, "Task configuration");

  return {
    taskTypeRegistry: { text: Editor },
    fallbackTaskEditor: Editor,
  };
});

import TaskEditor from "@/components/tasks/TaskEditor";

describe("TaskEditor", () => {
  it("renders saved narrative fields outside the task-type configuration", () => {
    const markup = renderToStaticMarkup(
      createElement(TaskEditor, {
        task: {
          id: "22222222-2222-4222-8222-222222222222",
          quest_id: "11111111-1111-4111-8111-111111111111",
          title: "Task",
          description: "Description",
          narrative_intro: "Before the challenge",
          narrative_success: "After the challenge",
          answer: null,
          hint: null,
          image_url: null,
          video_url: null,
          audio_url: null,
          content: null,
          points: 1,
          task_type: "text",
          sort_order: 1,
        },
        onSave: vi.fn(),
        onUploadImage: vi.fn(),
        onRemoveImage: vi.fn(),
      })
    );

    expect(markup).toContain("Сцена перед заданием");
    expect(markup).toContain("Переход после задания");
    expect(markup).toContain('id="task-narrative-intro"');
    expect(markup).toContain('id="task-narrative-success"');
    expect(markup).toContain('maxLength="4000"');
    expect(markup).toContain("Before the challenge");
    expect(markup).toContain("After the challenge");
    expect(markup.indexOf("История этапа")).toBeLessThan(
      markup.indexOf("Task configuration")
    );
  });
});
