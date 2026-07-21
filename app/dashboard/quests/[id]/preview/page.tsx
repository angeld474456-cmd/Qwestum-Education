import Link from "next/link";
import { notFound } from "next/navigation";

import QuestWorkspaceNav from "@/components/dashboard/QuestWorkspaceNav";
import Card from "@/components/ui/Card";
import TaskRenderer from "@/components/tasks/runtime/TaskRenderer";
import {
  getTeacherSubjects,
  type TeacherSubject,
} from "@/services/subject.server";
import { getQuestLanguageLabel } from "@/services/quest-language";
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

function formatGradeRange(gradeMin: number | null, gradeMax: number | null) {
  if (gradeMin === null || gradeMax === null) return null;

  if (gradeMin === gradeMax) {
    return `Grade ${gradeMin}`;
  }

  return `Grades ${gradeMin}-${gradeMax}`;
}

function formatDuration(minutes: number | null) {
  if (minutes === null) return null;

  return `${minutes} min`;
}

function formatSubject(subject: TeacherSubject | undefined) {
  if (!subject) return null;

  if (subject.grade === null) {
    return subject.name;
  }

  return `${subject.name} · Grade ${subject.grade}`;
}

export default async function TeacherQuestPreviewPage({
  params,
}: PreviewPageProps) {
  const { id } = await params;

  const quest = await getOwnedQuest(id);

  if (!quest) {
    notFound();
  }

  const [tasks, subjects] = await Promise.all([
    getOwnedQuestTasks(id),
    getTeacherSubjects(),
  ]);

  if (!tasks) {
    notFound();
  }

  const gradeLabel = formatGradeRange(quest.grade_min, quest.grade_max);
  const durationLabel = formatDuration(quest.estimated_duration_minutes);
  const subjectLabel = quest.subject_id
    ? formatSubject(subjects.find((subject) => subject.id === quest.subject_id))
    : null;
  const languageLabel = getQuestLanguageLabel(quest.language_code);

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
          {subjectLabel || languageLabel || gradeLabel || durationLabel ? (
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {subjectLabel ? (
                <span className="rounded-full bg-violet-500/10 px-3 py-1 font-semibold text-violet-200">
                  {subjectLabel}
                </span>
              ) : null}
              {languageLabel ? (
                <span className="rounded-full bg-indigo-500/10 px-3 py-1 font-semibold text-indigo-200">
                  {languageLabel}
                </span>
              ) : null}
              {gradeLabel ? (
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 font-semibold text-cyan-200">
                  {gradeLabel}
                </span>
              ) : null}
              {durationLabel ? (
                <span className="rounded-full bg-slate-700 px-3 py-1 font-semibold text-slate-200">
                  {durationLabel}
                </span>
              ) : null}
            </div>
          ) : null}
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
                  imageUrl={task.image_url}
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
