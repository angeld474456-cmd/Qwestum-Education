import Link from "next/link";
import { notFound } from "next/navigation";

import QuestCoverImageManager from "@/components/dashboard/QuestCoverImageManager";
import QuestSettingsForm from "@/components/dashboard/QuestSettingsForm";
import QuestWorkspaceNav from "@/components/dashboard/QuestWorkspaceNav";
import { getSafeQuestCoverImagePublicUrl } from "@/lib/storage/quest-cover.server";
import { getTeacherSubjects } from "@/services/subject.server";
import {
  getOwnedQuest,
  getOwnedQuestTaskCount,
} from "@/services/teacher-quest.server";

type SettingsPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    created?: string | string[];
  }>;
};

function getFirstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TeacherQuestSettingsPage({
  params,
  searchParams,
}: SettingsPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isNewlyCreated =
    getFirstSearchParam(resolvedSearchParams.created) === "1";
  const [quest, subjects, taskCount] = await Promise.all([
    getOwnedQuest(id),
    getTeacherSubjects(),
    getOwnedQuestTaskCount(id),
  ]);

  if (!quest) {
    notFound();
  }

  return (
    <section className="space-y-8 text-white">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Настройки квеста
          </p>
          <h1 className="mt-2 text-4xl font-bold">{quest.title}</h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            Настройте метаданные квеста и управляйте публикацией.
          </p>
        </div>

        <QuestWorkspaceNav questId={id} active="settings" />
      </div>

      {isNewlyCreated ? (
        <section className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Шаг 2 из 2
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Настройте черновик
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-300">
            Добавьте метаданные, обложку и задания. Когда квест будет готов,
            включите публикацию в настройках.
          </p>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Начните с заданий, чтобы квест можно было проверить в Preview и
            Play/Test.
          </p>
          <Link
            href={`/dashboard/quests/${id}/tasks`}
            className="mt-5 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Перейти к заданиям
          </Link>
        </section>
      ) : null}

      <QuestCoverImageManager
        questId={quest.id}
        initialCoverImageUrl={getSafeQuestCoverImagePublicUrl(
          quest.cover_image_path,
          quest.author_id,
          quest.id
        )}
      />

      <QuestSettingsForm
        quest={quest}
        subjects={subjects}
        taskCount={taskCount ?? 0}
      />
    </section>
  );
}
