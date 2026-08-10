"use client";

import { useRuntimeContext } from "./RuntimeContext";

export default function QuestResults() {
  const { answers, totalTasks } = useRuntimeContext();
  const answeredTasks = Object.values(answers).filter((answer) =>
    Array.isArray(answer) ? answer.length > 0 : answer.trim().length > 0
  ).length;
  const completionPercent =
    totalTasks > 0 ? Math.round((answeredTasks / totalTasks) * 100) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl bg-[#1B2435] p-5">
        <p className="text-sm text-slate-400">Всего заданий</p>
        <p className="mt-2 text-3xl font-bold">{totalTasks}</p>
      </div>

      <div className="rounded-2xl bg-[#1B2435] p-5">
        <p className="text-sm text-slate-400">Отвечено</p>
        <p className="mt-2 text-3xl font-bold">{answeredTasks}</p>
      </div>

      <div className="rounded-2xl bg-[#1B2435] p-5">
        <p className="text-sm text-slate-400">Завершено</p>
        <p className="mt-2 text-3xl font-bold">{completionPercent}%</p>
      </div>
    </div>
  );
}
