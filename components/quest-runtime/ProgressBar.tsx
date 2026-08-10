"use client";

import { useRuntimeContext } from "./RuntimeContext";

export default function ProgressBar() {
  const { currentIndex, totalTasks, progressPercent } = useRuntimeContext();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
        <span>
          Задание {totalTasks > 0 ? currentIndex + 1 : 0} из {totalTasks}
        </span>

        <span>{Math.round(progressPercent)}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#1B2435]">
        <div
          className="h-full rounded-full bg-violet-600 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
