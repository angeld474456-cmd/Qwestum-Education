import Link from "next/link";
import { notFound } from "next/navigation";

import QuestWorkspaceNav from "@/components/dashboard/QuestWorkspaceNav";
import QuestRunner from "@/components/quest-runtime/QuestRunner";
import Card from "@/components/ui/Card";
import {
  getOwnedQuest,
  getOwnedQuestTasks,
} from "@/services/teacher-quest.server";

type PlayPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TeacherQuestPlayPage({
  params,
}: PlayPageProps) {
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
            Тестирование
          </p>
          <h1 className="mt-2 text-4xl font-bold">{quest.title}</h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            Это тестовый запуск для учителя. Ответы и результаты пока не
            сохраняются.
          </p>
        </div>

        <QuestWorkspaceNav questId={id} active="play" />
      </div>

      {tasks.length === 0 ? (
        <Card className="text-center">
          <h2 className="text-2xl font-semibold">Заданий пока нет</h2>
          <p className="mt-3 text-slate-400">
            Добавьте задания перед тестированием квеста.
          </p>
          <Link
            href={`/dashboard/quests/${id}/tasks`}
            className="mt-6 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Перейти к заданиям
          </Link>
        </Card>
      ) : (
        <QuestRunner tasks={tasks} />
      )}
    </section>
  );
}
