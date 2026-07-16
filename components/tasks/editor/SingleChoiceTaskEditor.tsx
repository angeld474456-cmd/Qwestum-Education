"use client";

import { useState } from "react";
import ImageUploader from "@/components/media/ImageUploader";
import TaskPreview from "@/components/tasks/preview/TaskPreview";
import { QuestTask } from "@/services/quest.service";
import { TextTaskEditorProps } from "./TextTaskEditor";

interface SingleChoiceOption {
  id: string;
  text: string;
}

interface SingleChoiceContent {
  options: SingleChoiceOption[];
  correctOptionId: string;
}

function isSingleChoiceOption(value: unknown): value is SingleChoiceOption {
  if (!value || typeof value !== "object") return false;

  const option = value as Record<string, unknown>;

  return (
    typeof option.id === "string" &&
    typeof option.text === "string"
  );
}

function getSingleChoiceContent(task: QuestTask): SingleChoiceContent {
  const content = task.content;

  if (!content) {
    return {
      options: [],
      correctOptionId: "",
    };
  }

  const options = Array.isArray(content.options)
    ? content.options.filter(isSingleChoiceOption)
    : [];

  const correctOptionId =
    typeof content.correctOptionId === "string"
      ? content.correctOptionId
      : "";

  return {
    options,
    correctOptionId,
  };
}

function createOption(): SingleChoiceOption {
  return {
    id: crypto.randomUUID(),
    text: "",
  };
}

export default function SingleChoiceTaskEditor({
  task,
  onSave,
  onUploadImage,
  onRemoveImage,
}: TextTaskEditorProps) {
  const initialContent = getSingleChoiceContent(task);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [options, setOptions] = useState<SingleChoiceOption[]>(
    initialContent.options
  );
  const [correctOptionId, setCorrectOptionId] = useState(
    initialContent.correctOptionId
  );
  const hasCorrectOption = options.some(
    (option) => option.id === correctOptionId
  );
  const validationMessages = [
    options.length < 2 ? "Добавьте минимум два варианта ответа." : null,
    !hasCorrectOption ? "Выберите один правильный ответ." : null,
    options.some((option) => !option.text.trim())
      ? "Заполните текст каждого варианта ответа."
      : null,
  ].filter((message): message is string => Boolean(message));
  const isValid = validationMessages.length === 0;

  function handleAddOption() {
    setOptions((currentOptions) => [
      ...currentOptions,
      createOption(),
    ]);
  }

  function handleRemoveOption(optionId: string) {
    setOptions((currentOptions) =>
      currentOptions.filter((option) => option.id !== optionId)
    );

    if (correctOptionId === optionId) {
      setCorrectOptionId("");
    }
  }

  function handleOptionTextChange(optionId: string, text: string) {
    setOptions((currentOptions) =>
      currentOptions.map((option) =>
        option.id === optionId
          ? { ...option, text }
          : option
      )
    );
  }

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

      <div>
        <label className="mb-2 block text-slate-300">
          Варианты ответа
        </label>

        <div className="space-y-3">
          {options.map((option) => (
            <div
              key={option.id}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
            >
              <input
                type="radio"
                name={`correct-option-${task.id}`}
                checked={correctOptionId === option.id}
                onChange={() => setCorrectOptionId(option.id)}
              />

              <input
                value={option.text}
                onChange={(e) =>
                  handleOptionTextChange(option.id, e.target.value)
                }
                className="w-full rounded-xl bg-[#1B2435] p-4"
              />

              <button
                type="button"
                onClick={() => handleRemoveOption(option.id)}
                className="rounded-lg bg-red-600 px-4 py-3 hover:bg-red-700 transition"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddOption}
          className="mt-4 rounded-xl bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600 transition"
        >
          Добавить вариант
        </button>
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
          options={options}
          correctOptionId={correctOptionId}
        />
      </div>

      {validationMessages.length > 0 && (
        <div className="rounded-xl bg-red-950/40 p-4 text-sm text-red-200">
          {validationMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <div className="pt-4">
        <button
          disabled={!isValid}
          onClick={() =>
            onSave(task.id, title, description, {
              options,
              correctOptionId,
            })
          }
          className="rounded-xl bg-violet-600 px-8 py-4 font-semibold hover:bg-violet-700 disabled:opacity-50 transition"
        >
          💾 Сохранить
        </button>
      </div>

    </div>
  );
}
