"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CreateQuestResponse = {
  quest?: {
    id: string;
  };
  error?: string;
};

export default function NewQuestForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSave() {
    if (loading) return;

    const normalizedTitle = title.trim();

    setErrorMessage("");

    if (!normalizedTitle) {
      setErrorMessage("Введите название квеста");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/teacher/quests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: normalizedTitle,
          description,
          difficulty,
          is_public: isPublic,
        }),
      });

      const result = (await response.json()) as CreateQuestResponse;

      if (!response.ok || !result.quest?.id) {
        setErrorMessage(result.error ?? "Ошибка при сохранении квеста");
        return;
      }

      router.push(`/dashboard/quests/${result.quest.id}/settings`);
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage("Произошла непредвиденная ошибка.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070B14] p-8 text-white">
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
              onChange={(event) => setTitle(event.target.value)}
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
              onChange={(event) => setDescription(event.target.value)}
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
              onChange={(event) => setDifficulty(Number(event.target.value))}
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
              onChange={(event) => setIsPublic(event.target.checked)}
            />

            <label htmlFor="public">
              Сделать квест публичным
            </label>
          </div>

          {errorMessage ? (
            <p className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </p>
          ) : null}

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
