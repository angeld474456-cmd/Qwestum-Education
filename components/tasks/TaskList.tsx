"use client";

import { QuestTask } from "@/services/quest.service";
import TaskCard from "./TaskCard";

interface TaskListProps {
  tasks: QuestTask[];
  selectedTaskId: string | null;
  onSelectTask: (task: QuestTask) => void;
  onDelete: (id: string) => void;
}

export default function TaskList({
  tasks,
  selectedTaskId,
  onSelectTask,
  onDelete,
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

      {tasks.map((task, index) => (

        <div
          key={task.id}
          onClick={() => onSelectTask(task)}
          className={`cursor-pointer rounded-2xl transition ${
            selectedTaskId === task.id
              ? "ring-2 ring-violet-500"
              : ""
          }`}
        >

          <TaskCard
            index={index}
            task={task}
            onSelect={() => onSelectTask(task)}
            onDelete={onDelete}
          />

        </div>

      ))}

    </div>
  );
}
