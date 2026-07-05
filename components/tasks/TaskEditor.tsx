"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAutosave } from "./hooks/useAutosave";
import { QuestTask } from "@/services/quest.service";
import ImageUploader from "@/components/media/ImageUploader";
import SaveStatus from "./editor/SaveStatus";

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

type SaveStatusValue = "idle" | "saving" | "saved" | "error";

export default function TaskEditor({
  task,
  onSave,
  onUploadImage,
}: TaskEditorProps) {
  if (!task) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl bg-[#111827] p-8">
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

  return (
    <TaskEditorForm
      key={task.id}
      task={task}
      onSave={onSave}
      onUploadImage={onUploadImage}
    />
  );
}

function TaskEditorForm({
  task,
  onSave,
  onUploadImage,
}: {
  task: QuestTask;
  onSave: TaskEditorProps["onSave"];
  onUploadImage: TaskEditorProps["onUploadImage"];
}) {
  const initialValues = useMemo(
    () => ({
      title: task.title,
      description: task.description ?? "",
    }),
    [task.description, task.title]
  );

  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [savedValues, setSavedValues] = useState(initialValues);
  const [saveStatus, setSaveStatus] = useState<SaveStatusValue>("idle");
  const statusTimerRef = useRef<number | null>(null);

  const isDirty =
    title !== savedValues.title ||
    description !== savedValues.description;

  const autosaveDeps = useMemo(
    () => [task.id, title, description],
    [description, task.id, title]
  );

  const clearStatusTimer = useCallback(() => {
    if (statusTimerRef.current) {
      window.clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearStatusTimer;
  }, [clearStatusTimer]);

  const handleSave = useCallback(async () => {
    if (!isDirty) return;

    try {
      clearStatusTimer();
      setSaveStatus("saving");
      await onSave(task.id, title, description);
      setSavedValues({ title, description });
      setSaveStatus("saved");

      statusTimerRef.current = window.setTimeout(() => {
        setSaveStatus("idle");
        statusTimerRef.current = null;
      }, 2000);
    } catch (error) {
      console.error(error);
      setSaveStatus("error");
    }
  }, [clearStatusTimer, description, isDirty, onSave, task.id, title]);

  useAutosave({
    enabled: isDirty,
    delay: 1000,
    deps: autosaveDeps,
    onSave: handleSave,
  });

  return (
    <div className="rounded-2xl bg-[#111827] p-8">

      <h2 className="text-3xl font-bold">
        Редактор задания
      </h2>

      <div className="mt-6">
        <SaveStatus status={saveStatus} />
      </div>

      <div className="mt-8 space-y-6">

        <div>
          <label className="mb-2 block text-slate-300">
            Название
          </label>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl bg-[#1B2435] p-4"
          />
        </div>

        <div>
          <label className="mb-2 block text-slate-300">
            Описание
          </label>

          <textarea
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl bg-[#1B2435] p-4"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="mb-2 block text-slate-300">
              Тип задания
            </label>

            <input
              value={task.task_type}
              readOnly
              className="w-full rounded-xl bg-[#1B2435] p-4"
            />
          </div>

          <div>
            <label className="mb-2 block text-slate-300">
              Баллы
            </label>

            <input
              value={task.points}
              readOnly
              className="w-full rounded-xl bg-[#1B2435] p-4"
            />
          </div>

        </div>

        <ImageUploader
          imageUrl={task.image_url}
          onUpload={(file) => onUploadImage(task.id, file)}
        />

        <div className="pt-4">
          <button
            onClick={handleSave}
            className="rounded-xl bg-violet-600 px-8 py-4 font-semibold transition hover:bg-violet-700"
          >
            💾 Сохранить
          </button>
        </div>

      </div>

    </div>
  );
}
