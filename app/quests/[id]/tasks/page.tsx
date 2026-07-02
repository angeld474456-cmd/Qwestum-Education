"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getQuestTasks,
  createTask,
  QuestTask,
} from "@/services/quest.service";

export default function QuestTasksPage() {
  const params = useParams();
  const questId = params.id as string;

  const [tasks, setTasks] = useState<QuestTask[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (questId) {
      loadTasks();
    }
  }, [questId]);

  async function loadTasks() {
    setLoading(true);

    const { data, error } = await getQuestTasks(questId);

    console.log("========== QUEST TASKS ==========");
    console.log("Quest ID:", questId);
    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (error) {
      alert(JSON.stringify(error, null, 2));
      setLoading(false);
      return;
    }

    setTasks(data ?? []);
    setLoading(false);
  }

  async function handleCreateTask() {
    if (!title.trim()) {
      alert("Введите название задания");
      return;
    }

    const { error } = await createTask({
      quest_id: questId,
      title,
      description,
      answer: "",
      hint: "",
      image_url: "",
      video_url: "",
      audio_url: "",
      points: 1,
      task_type: "text",
      sort_order: tasks.length + 1,
    });

    if (error) {
      alert(JSON.stringify(error, null, 2));
      return;
    }

    setTitle("");
    setDescription("");

    loadTasks();
  }

  return (
    <main className="min-h-screen bg-[#070B14] text-white p-8">
      <div className="mx-auto max-w-6xl">

        <h1 className="text-4xl font-bold">
          Конструктор заданий
        </h1>

        <p className="mt-3 text-slate-400">
          Создание заданий для квеста
        </p>

        <div className="mt-10 rounded-3xl bg-[#111827] p-8">

          <h2 className="text-2xl font-bold">
            Новое задание
          </h2>

          <input
            className="mt-6 w-full rounded-xl bg-[#1B2435] p-4"
            placeholder="Название задания"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            rows={5}
            className="mt-4 w-full rounded-xl bg-[#1B2435] p-4"
            placeholder="Описание задания"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button
            onClick={handleCreateTask}
            className="mt-6 rounded-xl bg-violet-600 px-8 py-4 font-semibold hover:bg-violet-700"
          >
            Добавить задание
          </button>

        </div>

        <div className="mt-10">

          <h2 className="mb-6 text-3xl font-bold">
            Задания
          </h2>

          {loading ? (

            <div className="rounded-2xl bg-[#111827] p-8">
              Загрузка...
            </div>

          ) : tasks.length === 0 ? (

            <div className="rounded-2xl bg-[#111827] p-8">
              Пока заданий нет.
            </div>

          ) : (

            <div className="grid gap-5">

              {tasks.map((task) => (

                <div
                  key={task.id}
                  className="rounded-2xl bg-[#111827] p-6"
                >

                  <h3 className="text-2xl font-bold">
                    {task.title}
                  </h3>

                  <p className="mt-3 text-slate-400">
                    {task.description}
                  </p>

                  <div className="mt-5 flex gap-5 text-sm">

                    <span>
                      Тип: {task.task_type}
                    </span>

                    <span>
                      Баллы: {task.points}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>
    </main>
  );
}