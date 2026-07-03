"use client";

import { QuestTask } from "@/services/quest.service";

interface TaskCardProps {
  index: number;
  task: QuestTask;
  onDelete: (id: string) => void;
}

const taskTypes: Record<
  string,
  {
    icon: string;
    title: string;
    color: string;
  }
> = {
  text: {
    icon: "📝",
    title: "Текст",
    color: "bg-sky-500/20 text-sky-300",
  },
  quiz: {
    icon: "✅",
    title: "Тест",
    color: "bg-green-500/20 text-green-300",
  },
  qr: {
    icon: "📷",
    title: "QR",
    color: "bg-purple-500/20 text-purple-300",
  },
  image: {
    icon: "🖼",
    title: "Изображение",
    color: "bg-pink-500/20 text-pink-300",
  },
  map: {
    icon: "🗺",
    title: "Карта",
    color: "bg-orange-500/20 text-orange-300",
  },
};

export default function TaskCard({
  index,
  task,
  onDelete,
}: TaskCardProps) {
  const type =
    taskTypes[task.task_type] ?? {
      icon: "📄",
      title: task.task_type,
      color: "bg-slate-700 text-slate-200",
    };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6 transition hover:border-violet-500 hover:bg-[#162036]">

      <div className="flex items-start justify-between">

        <div className="flex-1">

          <div className="flex flex-wrap items-center gap-3">

            <h3 className="text-xl font-bold">
              {index + 1}. {task.title}
            </h3>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${type.color}`}
            >
              {type.icon} {type.title}
            </span>

            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
              🏆 {task.points} балл{task.points === 1 ? "" : "ов"}
            </span>

          </div>

          <p className="mt-4 text-slate-400">
            {task.description || "Описание отсутствует"}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">

            {task.image_url && (
              <span className="rounded-lg bg-slate-700 px-3 py-1 text-xs">
                🖼 Изображение
              </span>
            )}

            {task.video_url && (
              <span className="rounded-lg bg-slate-700 px-3 py-1 text-xs">
                🎥 Видео
              </span>
            )}

            {task.audio_url && (
              <span className="rounded-lg bg-slate-700 px-3 py-1 text-xs">
                🎵 Аудио
              </span>
            )}

            {task.hint && (
              <span className="rounded-lg bg-yellow-500/20 px-3 py-1 text-xs text-yellow-300">
                💡 Подсказка
              </span>
            )}

            {task.answer && (
              <span className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
                ✔ Ответ
              </span>
            )}
          </div>

        </div>

        <div className="ml-6 flex flex-col gap-2">

          <button
            disabled
            className="rounded-lg bg-slate-700 px-4 py-2 opacity-60"
          >
            ✏️
          </button>

          <button
            onClick={() => onDelete(task.id)}
            className="rounded-lg bg-red-600 px-4 py-2 transition hover:bg-red-700"
          >
            🗑
          </button>

        </div>

      </div>

    </div>
  );
}