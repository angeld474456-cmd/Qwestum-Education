"use client";

import type { ReactNode } from "react";

import { QuestTask } from "@/services/quest.service";
import TaskCard from "./TaskCard";

interface TaskListProps {
  tasks: QuestTask[];
  selectedTaskId: string | null;
  onSelectTask: (task: QuestTask) => void;
  onDelete: (id: string) => void;
  onMoveTask: (taskId: string, direction: "up" | "down") => void;
  reorderBusy: boolean;
  onRegisterTaskPencil: (
    taskId: string,
    element: HTMLButtonElement | null
  ) => void;
  renderSelectedEditor?: (task: QuestTask) => ReactNode;
  onRegisterSelectedRow?: (
    taskId: string,
    element: HTMLDivElement | null
  ) => void;
}

export default function TaskList({
  tasks,
  selectedTaskId,
  onSelectTask,
  onDelete,
  onMoveTask,
  reorderBusy,
  onRegisterTaskPencil,
  renderSelectedEditor,
  onRegisterSelectedRow,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl bg-[#111827] p-10 text-center">
        <h2 className="text-2xl font-semibold">
          Пока заданий нет
        </h2>

        <p className="mt-3 text-slate-400">
          Создайте первое задание для этого квеста.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {tasks.map((task, index) => {
        const isSelected = selectedTaskId === task.id;
        const taskCard = (
          <div
            onClick={() => onSelectTask(task)}
            className={`cursor-pointer rounded-2xl transition ${
              isSelected ? "ring-2 ring-violet-500" : ""
            }`}
          >
            <TaskCard
              index={index}
              task={task}
              isSelected={isSelected}
              onSelect={() => onSelectTask(task)}
              onDelete={onDelete}
              onMoveUp={() => onMoveTask(task.id, "up")}
              onMoveDown={() => onMoveTask(task.id, "down")}
              canMoveUp={index > 0}
              canMoveDown={index < tasks.length - 1}
              reorderBusy={reorderBusy}
              onRegisterPencil={onRegisterTaskPencil}
            />
          </div>
        );

        return (
          <div
            key={task.id}
            ref={
              isSelected
                ? (element) => onRegisterSelectedRow?.(task.id, element)
                : undefined
            }
            className={isSelected ? "scroll-mt-6" : undefined}
          >
            {isSelected && renderSelectedEditor ? (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                {taskCard}
                <div className="min-w-0">{renderSelectedEditor(task)}</div>
              </div>
            ) : (
              taskCard
            )}
          </div>
        );
      })}

    </div>
  );
}
