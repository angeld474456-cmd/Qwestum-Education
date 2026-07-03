"use client";

import { useEffect, useState } from "react";

import { QuestTask } from "@/services/quest.service";

import TaskGeneralSection from "./editor/TaskGeneralSection";
import TaskAnswerSection from "./editor/TaskAnswerSection";
import TaskSettingsSection from "./editor/TaskSettingsSection";
import TaskMediaSection from "./editor/TaskMediaSection";

interface TaskEditorProps {
  task: QuestTask | null;

  onSave: (
    id: string,
    title: string,
    description: string,
    answer: string,
    hint: string,
    points: number,
    taskType: string
  ) => Promise<void>;

  onUploadImage: (
    taskId: string,
    file: File
  ) => Promise<void>;
}

export default function TaskEditor({
  task,
  onSave,
  onUploadImage,
}: TaskEditorProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [points, setPoints] = useState(1);
  const [taskType, setTaskType] = useState("text");

  useEffect(() => {
    if (!task) {
      setTitle("");
      setDescription("");
      setAnswer("");
      setHint("");
      setPoints(1);
      setTaskType("text");
      return;
    }

    setTitle(task.title);
    setDescription(task.description ?? "");
    setAnswer(task.answer ?? "");
    setHint(task.hint ?? "");
    setPoints(task.points);
    setTaskType(task.task_type);
  }, [task]);

  if (!task) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl bg-[#111827] p-10">

        <div className="text-center">

          <h2 className="text-3xl font-bold">
            Выберите задание
          </h2>

          <p className="mt-3 text-slate-400">
            Нажмите на карточку задания слева.
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6">

      <TaskGeneralSection
        title={title}
        description={description}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
      />

      <TaskAnswerSection
        answer={answer}
        hint={hint}
        onAnswerChange={setAnswer}
        onHintChange={setHint}
      />

      <TaskSettingsSection
        taskType={taskType}
        points={points}
        onTaskTypeChange={setTaskType}
        onPointsChange={setPoints}
      />

      <TaskMediaSection
        imageUrl={task.image_url}
        onUpload={(file) => onUploadImage(task.id, file)}
      />

      <div className="flex justify-end">

        <button
          onClick={() =>
            onSave(
              task.id,
              title,
              description,
              answer,
              hint,
              points,
              taskType
            )
          }
          className="rounded-xl bg-violet-600 px-8 py-4 font-semibold transition hover:bg-violet-700"
        >
          💾 Сохранить изменения
        </button>

      </div>

    </div>
  );
}