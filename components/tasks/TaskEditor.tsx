"use client";

import { useState } from "react";

import {
  fallbackTaskEditor,
  taskTypeRegistry,
  type TaskEditorComponent,
} from "@/components/tasks/editor/TaskTypeRegistry";
import { QuestTask, TaskContent } from "@/services/quest.service";

interface TaskEditorProps {
  task: QuestTask | null;
  onSave: (
    id: string,
    title: string,
    description: string,
    points: number,
    content?: TaskContent | null,
    narrativeIntro?: string | null,
    narrativeSuccess?: string | null
  ) => Promise<void>;
  onUploadImage: (taskId: string, file: File) => Promise<void>;
  onRemoveImage: (taskId: string) => Promise<void>;
}

export default function TaskEditor({
  task,
  onSave,
  onUploadImage,
  onRemoveImage,
}: TaskEditorProps) {
  if (!task) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl bg-[#111827] p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Выберите задание</h2>
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
    <TaskEditorContent
      key={task.id}
      task={task}
      EditorComponent={EditorComponent}
      onSave={onSave}
      onUploadImage={onUploadImage}
      onRemoveImage={onRemoveImage}
    />
  );
}

type TaskEditorContentProps = Omit<TaskEditorProps, "task"> & {
  task: QuestTask;
  EditorComponent: TaskEditorComponent;
};

function TaskEditorContent({
  task,
  EditorComponent,
  onSave,
  onUploadImage,
  onRemoveImage,
}: TaskEditorContentProps) {
  const [narrativeIntro, setNarrativeIntro] = useState(
    task.narrative_intro ?? ""
  );
  const [narrativeSuccess, setNarrativeSuccess] = useState(
    task.narrative_success ?? ""
  );

  async function handleSave(
    id: string,
    title: string,
    description: string,
    points: number,
    content?: TaskContent | null
  ) {
    await onSave(
      id,
      title,
      description,
      points,
      content,
      narrativeIntro,
      narrativeSuccess
    );
  }

  return (
    <div className="rounded-2xl bg-[#111827] p-8">
      <h2 className="text-3xl font-bold">Редактор задания</h2>

      <section className="mt-8 space-y-5 rounded-xl border border-slate-700 bg-slate-900/30 p-5">
        <div>
          <h3 className="text-base font-semibold text-slate-200">
            История этапа
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Необязательно. До 4000 символов в каждом поле.
          </p>
        </div>

        <div>
          <label
            htmlFor="task-narrative-intro"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Сцена перед заданием
          </label>
          <textarea
            id="task-narrative-intro"
            rows={4}
            maxLength={4000}
            value={narrativeIntro}
            onChange={(event) => setNarrativeIntro(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 text-white outline-none transition focus:border-violet-500"
          />
          <p className="mt-2 text-sm text-slate-400">
            Что происходит в истории перед этим испытанием?
          </p>
        </div>

        <div>
          <label
            htmlFor="task-narrative-success"
            className="mb-2 block text-sm font-semibold text-slate-300"
          >
            Переход после задания
          </label>
          <textarea
            id="task-narrative-success"
            rows={4}
            maxLength={4000}
            value={narrativeSuccess}
            onChange={(event) => setNarrativeSuccess(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 text-white outline-none transition focus:border-violet-500"
          />
          <p className="mt-2 text-sm text-slate-400">
            Что происходит после прохождения этого этапа?
          </p>
        </div>
      </section>

      <EditorComponent
        task={task}
        onSave={handleSave}
        onUploadImage={onUploadImage}
        onRemoveImage={onRemoveImage}
      />
    </div>
  );
}
