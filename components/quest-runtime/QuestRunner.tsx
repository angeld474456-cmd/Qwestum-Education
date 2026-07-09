"use client";

import TaskRenderer from "@/components/tasks/runtime/TaskRenderer";
import {
  SingleChoiceRuntimeOption,
} from "@/components/tasks/runtime/SingleChoiceTaskRenderer";
import { QuestTask } from "@/services/quest.service";
import QuestFinishScreen from "./QuestFinishScreen";
import ProgressBar from "./ProgressBar";
import { RuntimeProvider, useRuntimeContext } from "./RuntimeContext";
import QuestStartScreen from "./QuestStartScreen";
import TaskNavigator from "./TaskNavigator";

interface QuestRunnerProps {
  tasks: QuestTask[];
}

interface SingleChoiceContent {
  options: SingleChoiceRuntimeOption[];
  correctOptionId: string;
}

function isSingleChoiceOption(value: unknown): value is SingleChoiceRuntimeOption {
  if (!value || typeof value !== "object") return false;

  const option = value as Record<string, unknown>;

  return (
    typeof option.id === "string" &&
    typeof option.text === "string"
  );
}

function getSingleChoiceContent(task: QuestTask): SingleChoiceContent {
  const content = task.content;

  if (!content) {
    return {
      options: [],
      correctOptionId: "",
    };
  }

  const options = Array.isArray(content.options)
    ? content.options.filter(isSingleChoiceOption)
    : [];

  const correctOptionId =
    typeof content.correctOptionId === "string"
      ? content.correctOptionId
      : "";

  return {
    options,
    correctOptionId,
  };
}

function QuestRunnerContent() {
  const { answers, currentTask, setAnswer, status } = useRuntimeContext();

  if (status === "start") {
    return <QuestStartScreen />;
  }

  if (status === "finished") {
    return <QuestFinishScreen />;
  }

  if (!currentTask) {
    return (
      <div className="rounded-2xl bg-[#111827] p-8 text-center text-slate-300">
        Заданий пока нет.
      </div>
    );
  }

  const singleChoiceContent = getSingleChoiceContent(currentTask);

  return (
    <div className="space-y-6">
      <ProgressBar />

      <TaskRenderer
        key={currentTask.id}
        mode="play"
        taskType={currentTask.task_type}
        title={currentTask.title}
        description={currentTask.description ?? ""}
        options={singleChoiceContent.options}
        correctOptionId={singleChoiceContent.correctOptionId}
        answer={answers[currentTask.id] ?? ""}
        onTextAnswerChange={(answer) => setAnswer(currentTask.id, answer)}
        onSingleChoiceAnswerChange={(optionId) =>
          setAnswer(currentTask.id, optionId)
        }
      />

      <TaskNavigator />
    </div>
  );
}

export default function QuestRunner({ tasks }: QuestRunnerProps) {
  return (
    <RuntimeProvider tasks={tasks}>
      <QuestRunnerContent />
    </RuntimeProvider>
  );
}
