"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getQuest, Quest } from "@/services/quest.service";

export default function QuestPage() {
  const params = useParams();
  const id = params.id as string;

  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function loadQuest() {
      const { data, error } = await getQuest(id);

      if (error) {
        console.error(error);
        alert("Квест не найден");
        setLoading(false);
        return;
      }

      setQuest(data);
      setLoading(false);
    }

    loadQuest();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070B14] text-white flex items-center justify-center">
        <h2 className="text-2xl">Загрузка...</h2>
      </main>
    );
  }

  if (!quest) {
    return (
      <main className="min-h-screen bg-[#070B14] text-white flex items-center justify-center">
        <h2 className="text-2xl">Квест не найден</h2>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070B14] text-white p-8">
      <div className="mx-auto max-w-6xl">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold">
              {quest.title}
            </h1>

            <p className="mt-3 text-slate-400">
              {quest.description}
            </p>
          </div>

          <Link
            href="/quests"
            className="rounded-xl bg-slate-700 px-6 py-3 hover:bg-slate-600 transition"
          >
            ← Назад
          </Link>

        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl bg-[#111827] p-6">
            <p className="text-slate-400">
              Сложность
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {quest.difficulty}
            </h2>
          </div>

          <div className="rounded-2xl bg-[#111827] p-6">
            <p className="text-slate-400">
              Статус
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              {quest.is_public ? "🌍 Публичный" : "🔒 Приватный"}
            </h2>
          </div>

          <div className="rounded-2xl bg-[#111827] p-6">
            <p className="text-slate-400">
              Задания
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              0
            </h2>
          </div>

        </div>

        <div className="mt-10 rounded-3xl bg-[#111827] p-8">

          <div className="flex items-center justify-between">

            <h2 className="text-3xl font-bold">
              Задания квеста
            </h2>

            <button
              className="rounded-xl bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-700 transition"
            >
              + Добавить задание
            </button>

          </div>

          <div className="mt-10 rounded-2xl border border-dashed border-slate-600 p-10 text-center">

            <h3 className="text-2xl font-semibold">
              Пока нет заданий
            </h3>

            <p className="mt-3 text-slate-400">
              Добавьте первое задание в этот квест.
            </p>

          </div>

        </div>

      </div>
    </main>
  );
}