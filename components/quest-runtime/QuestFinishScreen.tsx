"use client";

import QuestResults from "./QuestResults";
import { useRuntimeContext } from "./RuntimeContext";

export default function QuestFinishScreen() {
  const { restartQuest } = useRuntimeContext();

  return (
    <div className="space-y-6 rounded-2xl bg-[#111827] p-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Квест завершен</h2>

        <p className="mt-3 text-slate-400">
          Результаты прохождения сохранены локально для этой сессии.
        </p>
      </div>

      <QuestResults />

      <div className="text-center">
        <button
          type="button"
          onClick={restartQuest}
          className="rounded-xl bg-violet-600 px-8 py-4 font-semibold hover:bg-violet-700 transition"
        >
          Пройти заново
        </button>
      </div>
    </div>
  );
}
