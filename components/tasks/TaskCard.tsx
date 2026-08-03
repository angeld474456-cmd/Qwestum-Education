"use client";

import { useCallback, useRef } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { QuestTask } from "@/services/quest.service";
import { getTaskTypeLabel } from "@/components/tasks/editor/TextTaskEditor";

interface TaskCardProps {
  index: number;
  task: QuestTask;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  reorderBusy: boolean;
  onRegisterPencil: (
    taskId: string,
    element: HTMLButtonElement,
    isCleanup?: boolean
  ) => void;
}

export default function TaskCard({
  index,
  task,
  isSelected,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  reorderBusy,
  onRegisterPencil,
}: TaskCardProps) {
  const pencilElementRef = useRef<HTMLButtonElement | null>(null);
  const setPencilRef = useCallback(
    (element: HTMLButtonElement | null) => {
      if (element) {
        pencilElementRef.current = element;
        onRegisterPencil(task.id, element);
        return;
      }

      const mountedElement = pencilElementRef.current;

      if (mountedElement) {
        onRegisterPencil(task.id, mountedElement, true);
        pencilElementRef.current = null;
      }
    },
    [onRegisterPencil, task.id]
  );

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

          <div className="flex gap-2" aria-label="Task order controls">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onMoveUp();
              }}
              disabled={!canMoveUp || reorderBusy}
              className="rounded-lg bg-slate-700 p-2 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Move task ${index + 1} up`}
              title="Move task up"
            >
              <ArrowUp aria-hidden="true" size={18} />
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onMoveDown();
              }}
              disabled={!canMoveDown || reorderBusy}
              className="rounded-lg bg-slate-700 p-2 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Move task ${index + 1} down`}
              title="Move task down"
            >
              <ArrowDown aria-hidden="true" size={18} />
            </button>
          </div>

          <button
            type="button"
            ref={setPencilRef}
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
