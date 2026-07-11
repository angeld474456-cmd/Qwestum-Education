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
  }) => Promise<void>;
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

    await onSave({
      title,
      description,
      answer,
      hint,
      points,
      taskType,
    });

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

      <input
        className="mt-6 w-full rounded-xl bg-[#1B2435] p-4"
        placeholder="Название задания"
        value={title}
        onChange={(e)=>setTitle(e.target.value)}
      />

      <textarea
        rows={4}
        className="mt-4 w-full rounded-xl bg-[#1B2435] p-4"
        placeholder="Описание"
        value={description}
        onChange={(e)=>setDescription(e.target.value)}
      />

      <input
        className="mt-4 w-full rounded-xl bg-[#1B2435] p-4"
        placeholder="Правильный ответ"
        value={answer}
        onChange={(e)=>setAnswer(e.target.value)}
      />

      <textarea
        rows={2}
        className="mt-4 w-full rounded-xl bg-[#1B2435] p-4"
        placeholder="Подсказка"
        value={hint}
        onChange={(e)=>setHint(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4 mt-4">

        <select
          value={taskType}
          onChange={(e)=>setTaskType(e.target.value as TaskType)}
          className="rounded-xl bg-[#1B2435] p-4"
        >
          <option value="text">Text</option>
          <option value="single_choice">Single choice</option>
        </select>

        <input
          type="number"
          value={points}
          min={1}
          onChange={(e)=>setPoints(Number(e.target.value))}
          className="rounded-xl bg-[#1B2435] p-4"
        />

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
