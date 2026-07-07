"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getQuests, Quest } from "@/services/quest.service";

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuests() {
      const { data, error } = await getQuests();

      if (error) {
        console.error(error);
      alert("Ошибка загрузки квестов");
        return;
    }

      setQuests(data ?? []);
      setLoading(false);
      }

    loadQuests();
  }, []);

  return (
    <main className="min-h-screen bg-[#070B14] text-white p-8">
      <div className="mx-auto max-w-6xl">

        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Каталог квестов
            </h1>

            <p className="mt-2 text-slate-400">
              Все созданные образовательные квесты
            </p>
          </div>

          <Link
            href="/quests/new"
            className="rounded-xl bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-700 transition"
          >
            + Создать квест
          </Link>
        </div>

        {loading ? (
          <p>Загрузка...</p>
        ) : quests.length === 0 ? (
          <div className="rounded-2xl bg-[#111827] p-10 text-center">
            <h2 className="text-2xl font-semibold">
              Пока нет квестов
            </h2>

            <p className="mt-3 text-slate-400">
              Создайте первый квест.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">

            {quests.map((quest) => (

              <div
                key={quest.id}
                className="rounded-2xl bg-[#111827] p-6"
              >

                <h2 className="text-2xl font-bold">
                  {quest.title}
                </h2>

                <p className="mt-3 text-slate-400">
                  {quest.description}
                </p>

                <div className="mt-4 flex gap-6 text-sm text-slate-300">
                  <span>
                    Сложность: {quest.difficulty}
                  </span>

                  <span>
                    {quest.is_public ? "🌍 Публичный" : "🔒 Приватный"}
                  </span>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">

                  <Link
                    href={`/quests/${quest.id}`}
                    className="rounded-lg bg-blue-600 px-5 py-2 hover:bg-blue-700 transition"
                  >
                    📂 Открыть
                  </Link>

                  <Link
                    href={`/quests/${quest.id}/tasks`}
                    className="rounded-lg bg-violet-600 px-5 py-2 hover:bg-violet-700 transition"
                  >
                    🧩 Конструктор
                  </Link>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>
    </main>
  );
}
