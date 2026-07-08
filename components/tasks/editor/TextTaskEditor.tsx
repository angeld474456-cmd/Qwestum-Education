"use client";

import { useState } from "react";
import ImageUploader from "@/components/media/ImageUploader";
import { QuestTask, TaskContent } from "@/services/quest.service";

export interface TextTaskEditorProps {
  task: QuestTask;
  onSave: (
    id: string,
    title: string,
    description: string,
    content?: TaskContent | null
  ) => Promise<void>;
  onUploadImage: (
    taskId: string,
    file: File
  ) => Promise<void>;
}

export default function TextTaskEditor({
  task,
  onSave,
  onUploadImage,
}: TextTaskEditorProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");

  return (
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
          onClick={() => onSave(task.id, title, description)}
          className="rounded-xl bg-violet-600 px-8 py-4 font-semibold hover:bg-violet-700 transition"
        >
          💾 Сохранить
        </button>
      </div>

    </div>
  );
}
