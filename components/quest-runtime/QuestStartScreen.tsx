"use client";

import { useRuntimeContext } from "./RuntimeContext";

export default function QuestStartScreen() {
  const { startQuest, totalTasks } = useRuntimeContext();

  return (
    <div className="rounded-2xl bg-[#111827] p-8 text-center">
      <h2 className="text-3xl font-bold">Готовы начать квест?</h2>

      <p className="mt-3 text-slate-400">
        Заданий в квесте: {totalTasks}
      </p>

      <button
        type="button"
        onClick={startQuest}
        disabled={totalTasks === 0}
        className="mt-8 rounded-xl bg-violet-600 px-8 py-4 font-semibold hover:bg-violet-700 disabled:opacity-50 transition"
      >
        Начать
      </button>
    </div>
  );
}
