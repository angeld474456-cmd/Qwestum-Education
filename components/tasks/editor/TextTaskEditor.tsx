"use client";

import { useState } from "react";
import ImageUploader from "@/components/media/ImageUploader";
import TaskPreview from "@/components/tasks/preview/TaskPreview";
import {
  POINTS_VALIDATION_MESSAGE,
  parsePositiveSafeInteger,
} from "@/lib/task-points";
import { QuestTask, TaskContent } from "@/services/quest.service";

export interface TextTaskEditorProps {
  task: QuestTask;
  onSave: (
    id: string,
    title: string,
    description: string,
    points: number,
    content?: TaskContent | null
  ) => Promise<void>;
  onUploadImage: (
    taskId: string,
    file: File
  ) => Promise<void>;
  onRemoveImage: (taskId: string) => Promise<void>;
}

export function getTaskTypeLabel(taskType: string) {
  if (taskType === "text") return "Текстовое задание";
  if (taskType === "single_choice") return "Выбор одного ответа";
  if (taskType === "multiple_choice") return "Выбор нескольких ответов";
  if (taskType === "sequence") return "Последовательность";
  return taskType;
}

export default function TextTaskEditor({
  task,
  onSave,
  onUploadImage,
  onRemoveImage,
}: TextTaskEditorProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [points, setPoints] = useState(String(task.points));
  const parsedPoints = parsePositiveSafeInteger(points);
  const isPointsValid = parsedPoints !== null;
  const validationMessages = [
    !title.trim() ? "Введите название задания." : null,
    !description.trim() ? "Введите описание задания." : null,
    !isPointsValid ? POINTS_VALIDATION_MESSAGE : null,
  ].filter((message): message is string => Boolean(message));
  const isValid = validationMessages.length === 0;

  return (
    <div className="mt-8 space-y-6">

      <div>
        <label
          htmlFor="text-task-title"
          className="mb-2 block text-slate-300"
        >
          Название
        </label>

        <input
          id="text-task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl bg-[#1B2435] p-4"
        />
      </div>

      <div>
        <label
          htmlFor="text-task-description"
          className="mb-2 block text-slate-300"
        >
          Текст задания
        </label>

        <textarea
          id="text-task-description"
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl bg-[#1B2435] p-4"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">

        <div>
          <label
            htmlFor="text-task-type"
            className="mb-2 block text-slate-300"
          >
            Тип задания
          </label>

          <input
            id="text-task-type"
            value={getTaskTypeLabel(task.task_type)}
            readOnly
            className="w-full rounded-xl bg-[#1B2435] p-4"
          />

          <p className="mt-2 text-sm leading-5 text-slate-400">
            Тип задания выбирается при создании и не меняется после сохранения.
            <br />
            Чтобы использовать другой тип, создайте новое задание и при
            необходимости удалите прежнее.
          </p>
        </div>

        <div>
          <label
            htmlFor="text-task-points"
            className="mb-2 block text-slate-300"
          >
            Баллы
          </label>

          <input
            id="text-task-points"
            type="number"
            min={1}
            step={1}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="w-full rounded-xl bg-[#1B2435] p-4"
            aria-label="Баллы"
            aria-invalid={!isPointsValid || undefined}
            aria-describedby={
              !isPointsValid ? "text-task-points-error" : undefined
            }
          />
        </div>

      </div>

      <ImageUploader
        imageUrl={task.image_url}
        onUpload={(file) => onUploadImage(task.id, file)}
        onRemove={() => onRemoveImage(task.id)}
      />

      <div>
        <label className="mb-2 block text-slate-300">
          Предпросмотр
        </label>

        <TaskPreview
          taskType={task.task_type}
          title={title}
          description={description}
        />
      </div>

      {validationMessages.length > 0 && (
        <div className="rounded-xl bg-red-950/40 p-4 text-sm text-red-200">
          {validationMessages.map((message) => (
            <p
              key={message}
              id={
                message === POINTS_VALIDATION_MESSAGE
                  ? "text-task-points-error"
                  : undefined
              }
            >
              {message}
            </p>
          ))}
        </div>
      )}

      <div className="pt-4">
        <button
          disabled={!isValid}
          onClick={() => {
            if (parsedPoints !== null) {
              onSave(task.id, title, description, parsedPoints);
            }
          }}
          className="rounded-xl bg-violet-600 px-8 py-4 font-semibold hover:bg-violet-700 disabled:opacity-50 transition"
        >
          💾 Сохранить
        </button>
      </div>

    </div>
  );
}
