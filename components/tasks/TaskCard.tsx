"use client";

import { QuestTask } from "@/services/quest.service";
import { getTaskTypeLabel } from "@/components/tasks/editor/TextTaskEditor";

interface TaskCardProps {
  index: number;
  task: QuestTask;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({
  index,
  task,
  isSelected,
  onSelect,
  onDelete,
}: TaskCardProps) {
  return (
    <div className="rounded-2xl bg-[#111827] p-6">

      <div className="flex items-start justify-between">

        <div>

          <h3 className="text-2xl font-bold">
            {index + 1}. {task.title}
          </h3>

          <p className="mt-3 text-slate-400">
            {task.description || "Без описания"}
          </p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300">

            <span>
              Тип: {getTaskTypeLabel(task.task_type)}
            </span>

            <span>
              🏆 Баллы: {task.points}
            </span>

            {isSelected ? <span className="text-violet-300">Выбрано</span> : null}

          </div>

        </div>

        <div className="flex gap-3">

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect();
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-700 transition"
            aria-label={`Открыть задание «${task.title}»`}
            aria-current={isSelected ? "true" : undefined}
          >
            ✏️
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(task.id);
            }}
            className="rounded-lg bg-red-600 px-4 py-2 hover:bg-red-700 transition"
            aria-label="Удалить задание"
          >
            🗑
          </button>

        </div>

      </div>

    </div>
  );
}
