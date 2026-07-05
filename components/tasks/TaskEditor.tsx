"use client";

import { useEffect, useState } from "react";
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

export default function TaskEditor({
  task,
  onSave,
  onUploadImage,
}: TaskEditorProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  useEffect(() => {
    if (!task) {
      setTitle("");
      setDescription("");
      setSaveStatus("idle");
      return;
    }

    setTitle(task.title);
    setDescription(task.description ?? "");
    setSaveStatus("idle");
  }, [task]);

  async function handleSave() {
    if (!task) return;

    try {
      setSaveStatus("saving");
      await onSave(task.id, title, description);
      setSaveStatus("saved");

      window.clearTimeout((handleSave as any)._timer);
      (handleSave as any)._timer = window.setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error(error);
      setSaveStatus("error");
    }
  }

  useAutosave({
    enabled: task !== null,
    delay: 1000,
    deps: [title, description],
    onSave: handleSave,
  });

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