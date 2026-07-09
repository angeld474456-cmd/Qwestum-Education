"use client";

import { useRuntimeContext } from "./RuntimeContext";

export default function TaskNavigator() {
  const {
    canGoNext,
    canGoPrevious,
    goNext,
    goPrevious,
  } = useRuntimeContext();

  return (
    <div className="flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={goPrevious}
        disabled={!canGoPrevious}
        className="rounded-xl bg-slate-700 px-6 py-3 font-semibold hover:bg-slate-600 disabled:opacity-50 transition"
      >
        Назад
      </button>

      <button
        type="button"
        onClick={goNext}
        disabled={!canGoNext}
        className="rounded-xl bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-700 disabled:opacity-50 transition"
      >
        Далее
      </button>
    </div>
  );
}
