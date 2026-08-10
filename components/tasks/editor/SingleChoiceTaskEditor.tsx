"use client";

import { useState } from "react";
import ImageUploader from "@/components/media/ImageUploader";
import TaskPreview from "@/components/tasks/preview/TaskPreview";
import {
  POINTS_VALIDATION_MESSAGE,
  parsePositiveSafeInteger,
} from "@/lib/task-points";
import { QuestTask } from "@/services/quest.service";
import { getTaskTypeLabel, TextTaskEditorProps } from "./TextTaskEditor";

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

function autoSizeOptionTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;

  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
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
  const [points, setPoints] = useState(String(task.points));
  const [options, setOptions] = useState<SingleChoiceOption[]>(
    initialContent.options
  );
  const [correctOptionId, setCorrectOptionId] = useState(
    initialContent.correctOptionId
  );
  const hasCorrectOption = options.some(
    (option) => option.id === correctOptionId
  );
  const parsedPoints = parsePositiveSafeInteger(points);
  const isPointsValid = parsedPoints !== null;
  const validationMessages = [
    options.length < 2 ? "Добавьте минимум два варианта ответа." : null,
    !hasCorrectOption ? "Выберите один правильный ответ." : null,
    options.some((option) => !option.text.trim())
      ? "Заполните текст каждого варианта ответа."
      : null,
    !isPointsValid ? POINTS_VALIDATION_MESSAGE : null,
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
        <label
          htmlFor="single-choice-task-title"
          className="mb-2 block text-slate-300"
        >
          Вопрос
        </label>

        <input
          id="single-choice-task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl bg-[#1B2435] p-4"
        />
      </div>

      <div>
        <label
          htmlFor="single-choice-task-description"
          className="mb-2 block text-slate-300"
        >
          Описание
        </label>

        <textarea
          id="single-choice-task-description"
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
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]"
            >
              <input
                type="radio"
                name={`correct-option-${task.id}`}
                value={option.id}
                checked={correctOptionId === option.id}
                onChange={() => setCorrectOptionId(option.id)}
                onClick={() => setCorrectOptionId(option.id)}
                aria-label="Правильный ответ"
              />

              <textarea
                rows={3}
                value={option.text}
                ref={autoSizeOptionTextarea}
                onInput={(event) => autoSizeOptionTextarea(event.currentTarget)}
                onChange={(e) =>
                  handleOptionTextChange(option.id, e.target.value)
                }
                className="min-h-24 min-w-0 w-full resize-y overflow-x-hidden break-words rounded-xl bg-[#1B2435] p-4"
                aria-label="Вариант ответа"
              />

              <button
                type="button"
                onClick={() => handleRemoveOption(option.id)}
                className="col-start-2 justify-self-start rounded-lg bg-red-600 px-4 py-3 transition hover:bg-red-700 md:col-auto md:justify-self-end md:self-start"
                aria-label="Удалить вариант"
              >
                Удалить вариант
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
          <label
            htmlFor="single-choice-task-type"
            className="mb-2 block text-slate-300"
          >
            Тип задания
          </label>

          <input
            id="single-choice-task-type"
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
            htmlFor="single-choice-task-points"
            className="mb-2 block text-slate-300"
          >
            Баллы
          </label>

          <input
            id="single-choice-task-points"
            type="number"
            min={1}
            step={1}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="w-full rounded-xl bg-[#1B2435] p-4"
            aria-label="Баллы"
            aria-invalid={!isPointsValid || undefined}
            aria-describedby={
              !isPointsValid ? "single-choice-task-points-error" : undefined
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
          options={options}
          correctOptionId={correctOptionId}
        />
      </div>

      {validationMessages.length > 0 && (
        <div className="rounded-xl bg-red-950/40 p-4 text-sm text-red-200">
          {validationMessages.map((message) => (
            <p
              key={message}
              id={
                message === POINTS_VALIDATION_MESSAGE
                  ? "single-choice-task-points-error"
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
              onSave(task.id, title, description, parsedPoints, {
                options,
                correctOptionId,
              });
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
