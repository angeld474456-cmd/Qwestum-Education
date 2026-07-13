import Link from "next/link";
import { notFound } from "next/navigation";

import QuestWorkspaceNav from "@/components/dashboard/QuestWorkspaceNav";
import Card from "@/components/ui/Card";
import TaskRenderer from "@/components/tasks/runtime/TaskRenderer";
import {
  SingleChoiceRuntimeOption,
} from "@/components/tasks/runtime/SingleChoiceTaskRenderer";
import {
  getOwnedQuest,
  getOwnedQuestTasks,
  type TeacherQuestTask,
} from "@/services/teacher-quest.server";

type PreviewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type SingleChoiceContent = {
  options: SingleChoiceRuntimeOption[];
  correctOptionId: string;
};

function isSingleChoiceOption(value: unknown): value is SingleChoiceRuntimeOption {
  if (!value || typeof value !== "object") return false;

  const option = value as Record<string, unknown>;

  return (
    typeof option.id === "string" &&
    typeof option.text === "string"
  );
}

function getSingleChoiceContent(task: TeacherQuestTask): SingleChoiceContent {
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

export default async function TeacherQuestPreviewPage({
  params,
}: PreviewPageProps) {
  const { id } = await params;

  const quest = await getOwnedQuest(id);

  if (!quest) {
    notFound();
  }

  const tasks = await getOwnedQuestTasks(id);

  if (!tasks) {
    notFound();
  }

  return (
    <section className="space-y-8 text-white">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Teacher Preview
          </p>
          <h1 className="mt-2 text-4xl font-bold">{quest.title}</h1>
          {quest.description ? (
            <p className="mt-3 max-w-3xl text-slate-400">
              {quest.description}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-slate-300">
            Tasks: {tasks.length}
          </p>
        </div>

        <QuestWorkspaceNav questId={id} active="preview" />
      </div>

      {tasks.length === 0 ? (
        <Card className="text-center">
          <h2 className="text-2xl font-semibold">No tasks yet</h2>
          <p className="mt-3 text-slate-400">
            Add tasks before previewing this quest.
          </p>
          <Link
            href={`/quests/${id}/tasks`}
            className="mt-6 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Edit tasks
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {tasks.map((task, index) => {
            const singleChoiceContent = getSingleChoiceContent(task);

            return (
              <Card key={task.id}>
                <div className="mb-4 text-sm font-semibold text-slate-400">
                  Task {index + 1}
                </div>
                <TaskRenderer
                  mode="preview"
                  taskType={task.task_type}
                  title={task.title}
                  description={task.description ?? ""}
                  options={singleChoiceContent.options}
                  correctOptionId={singleChoiceContent.correctOptionId}
                />
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
