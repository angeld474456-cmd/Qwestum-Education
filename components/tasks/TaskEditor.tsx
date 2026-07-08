"use client";

import { QuestTask } from "@/services/quest.service";
import {
  fallbackTaskEditor,
  taskTypeRegistry,
} from "@/components/tasks/editor/TaskTypeRegistry";

interface TaskEditorProps {
  task: QuestTask | null;
  onSave: (
    id: string,
    title: string,
    description: string
  ) => Promise<void>;

  onUploadImage: (
    taskId: string,
    file: File
  ) => Promise<void>;
}

export default function TaskEditor({
  task,
  onSave,
  onUploadImage,
}: TaskEditorProps) {
  if (!task) {
    return (
      <div className="rounded-2xl bg-[#111827] p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            Выберите задание
          </h2>

          <p className="mt-3 text-slate-400">
            Нажмите на карточку задания слева для редактирования.
          </p>
        </div>
      </div>
    );
  }

  const EditorComponent =
    taskTypeRegistry[task.task_type] ?? fallbackTaskEditor;

  return (
    <div className="rounded-2xl bg-[#111827] p-8">

      <h2 className="text-3xl font-bold">
        Редактор задания
      </h2>

      <EditorComponent
        key={task.id}
        task={task}
        onSave={onSave}
        onUploadImage={onUploadImage}
      />

    </div>
  );
}
