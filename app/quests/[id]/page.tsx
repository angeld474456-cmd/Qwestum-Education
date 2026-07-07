"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getQuest, getQuestTasks, Quest, QuestTask } from "@/services/quest.service";

export default function QuestPage() {
  const params = useParams();
  const id = params.id as string;

  const [quest, setQuest] = useState<Quest | null>(null);
  const [tasks, setTasks] = useState<QuestTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function loadQuest() {
      const { data, error } = await getQuest(id);

      if (error) {
        console.error(error);
        return;
      }

      setQuest(data);
      setLoading(false);
    }

    async function loadTasks() {
      const { data } = await getQuestTasks(id);
      setTasks(data ?? []);
    }

    loadQuest();
    loadTasks();
  }, [id]);

  if (loading || !quest) {
    return (
      <main className="min-h-screen bg-[#070B14] text-white flex items-center justify-center">
        Загрузка...
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
            className="rounded-xl bg-slate-700 px-6 py-3"
          >
            ← Назад
          </Link>

        </div>

        <div className="mt-10 grid grid-cols-3 gap-6">

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
              Заданий
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {tasks.length}
            </h2>

          </div>

        </div>

        <div className="mt-10 rounded-3xl bg-[#111827] p-8">

          <div className="flex items-center justify-between">

            <h2 className="text-3xl font-bold">
              Задания
            </h2>

            <Link
              href={`/quests/${id}/tasks`}
              className="rounded-xl bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-700"
            >
              + Добавить задание
            </Link>

          </div>

          <div className="mt-8">

            {tasks.length === 0 ? (

              <div className="rounded-xl border border-dashed border-slate-600 p-8 text-center">

                Пока заданий нет

              </div>

            ) : (

              <div className="space-y-4">

                {tasks.map((task, index) => (

                  <div
                    key={task.id}
                    className="rounded-xl bg-[#1B2435] p-5 flex items-center justify-between"
                  >

                    <div>

                      <h3 className="font-bold">
                        {index + 1}. {task.title}
                      </h3>

                      <p className="text-slate-400 mt-2">
                        {task.description}
                      </p>

                    </div>

                    <Link
                      href={`/quests/${id}/tasks`}
                      className="rounded-lg bg-violet-600 px-4 py-2"
                    >
                      Открыть
                    </Link>

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

      </div>
    </main>
  );
}
