"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuest } from "@/services/quest.service";

export default function NewQuestPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      alert("Введите название квеста");
      return;
    }

    setLoading(true);

    try {
      const error = await createQuest({
        title,
        description,
        difficulty,
        is_public: isPublic,
      });

      if (error) {
        console.error(error);
        alert("Ошибка при сохранении квеста");
        return;
      }

      alert("Квест успешно создан!");

      router.push("/quests");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Произошла непредвиденная ошибка.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070B14] text-white p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold">
          Создание нового квеста
        </h1>

        <p className="mt-3 text-slate-400">
          Заполните информацию о будущем квесте.
        </p>

        <div className="mt-10 rounded-3xl bg-[#111827] p-8">

          <div className="mb-6">
            <label className="mb-2 block text-sm text-slate-300">
              Название квеста
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Тайны Древнего Египта"
              className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 outline-none focus:border-violet-500"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm text-slate-300">
              Описание
            </label>

            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание квеста..."
              className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 outline-none focus:border-violet-500"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm text-slate-300">
              Сложность
            </label>

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-700 bg-[#1B2435] p-4 outline-none focus:border-violet-500"
            >
              <option value={1}>1 — Лёгкий</option>
              <option value={2}>2 — Средний</option>
              <option value={3}>3 — Сложный</option>
            </select>
          </div>

          <div className="mb-8 flex items-center gap-3">
            <input
              id="public"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />

            <label htmlFor="public">
              Сделать квест публичным
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-xl bg-violet-600 px-8 py-4 font-semibold hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? "Сохранение..." : "Сохранить квест"}
          </button>

        </div>
      </div>
    </main>
  );
}