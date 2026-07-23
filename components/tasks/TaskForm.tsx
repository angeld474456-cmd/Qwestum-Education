"use client";

import { useState } from "react";

type TaskType = "text" | "single_choice";

interface TaskFormProps {
  onSave: (task: {
    title: string;
    description: string;
    answer: string;
    hint: string;
    points: number;
    taskType: TaskType;
  }) => Promise<boolean>;
}

export default function TaskForm({ onSave }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [points, setPoints] = useState(1);
  const [taskType, setTaskType] = useState<TaskType>("text");

  async function handleSubmit() {
    if (!title.trim()) {
      alert("Введите название задания");
      return;
    }

    const created = await onSave({
      title,
      description,
      answer,
      hint,
      points,
      taskType,
    });

    if (!created) return;

    setTitle("");
    setDescription("");
    setAnswer("");
    setHint("");
    setPoints(1);
    setTaskType("text");
  }

  return (
    <div className="rounded-3xl bg-[#111827] p-8">

      <h2 className="text-2xl font-bold">
        Новое задание
      </h2>

      <div className="mt-6">
        <label htmlFor="task-title" className="mb-2 block text-slate-300">
          Название задания
        </label>

        <input
          id="task-title"
          className="w-full rounded-xl bg-[#1B2435] p-4"
          placeholder="Название задания"
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <label htmlFor="task-description" className="mb-2 block text-slate-300">
          Описание
        </label>

        <textarea
          id="task-description"
          rows={4}
          className="w-full rounded-xl bg-[#1B2435] p-4"
          placeholder="Описание"
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <label htmlFor="task-answer" className="mb-2 block text-slate-300">
          Правильный ответ
        </label>

        <input
          id="task-answer"
          className="w-full rounded-xl bg-[#1B2435] p-4"
          placeholder="Правильный ответ"
          value={answer}
          onChange={(e)=>setAnswer(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <label htmlFor="task-hint" className="mb-2 block text-slate-300">
          Подсказка
        </label>

        <textarea
          id="task-hint"
          rows={2}
          className="w-full rounded-xl bg-[#1B2435] p-4"
          placeholder="Подсказка"
          value={hint}
          onChange={(e)=>setHint(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">

        <div>
          <label htmlFor="task-type" className="mb-2 block text-slate-300">
            Тип задания
          </label>

          <select
            id="task-type"
            value={taskType}
            onChange={(e)=>setTaskType(e.target.value as TaskType)}
            className="w-full rounded-xl bg-[#1B2435] p-4"
            aria-label="Тип задания"
          >
            <option value="text">Текстовое задание</option>
            <option value="single_choice">Выбор одного ответа</option>
          </select>
        </div>

        <div>
          <label htmlFor="task-points" className="mb-2 block text-slate-300">
            Баллы
          </label>

          <input
            id="task-points"
            type="number"
            value={points}
            min={1}
            onChange={(e)=>setPoints(Number(e.target.value))}
            className="w-full rounded-xl bg-[#1B2435] p-4"
            aria-label="Баллы"
          />
        </div>

      </div>

      <button
        onClick={handleSubmit}
        className="mt-6 rounded-xl bg-violet-600 px-8 py-4 font-semibold hover:bg-violet-700"
      >
        ➕ Добавить задание
      </button>

    </div>
  );
}
