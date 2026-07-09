import Link from "next/link";

import QuestWorkspaceNav from "@/components/dashboard/QuestWorkspaceNav";
import QuestRunner from "@/components/quest-runtime/QuestRunner";
import Card from "@/components/ui/Card";
import { getQuest, getQuestTasks } from "@/services/quest.service";

type PlayPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TeacherQuestPlayPage({
  params,
}: PlayPageProps) {
  const { id } = await params;

  const [questResult, tasksResult] = await Promise.all([
    getQuest(id),
    getQuestTasks(id),
  ]);

  if (questResult.error || !questResult.data) {
    return (
      <section className="space-y-6 text-white">
        <Card>
          <h1 className="text-3xl font-bold">Quest not found</h1>
          <p className="mt-3 text-slate-400">
            The selected quest could not be loaded.
          </p>
          <Link
            href="/dashboard/quests"
            className="mt-6 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Back to library
          </Link>
        </Card>
      </section>
    );
  }

  if (tasksResult.error) {
    return (
      <section className="space-y-6 text-white">
        <Card>
          <h1 className="text-3xl font-bold">Unable to start test mode</h1>
          <p className="mt-3 text-slate-400">
            The quest loaded, but its tasks could not be loaded.
          </p>
          <Link
            href="/dashboard/quests"
            className="mt-6 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Back to library
          </Link>
        </Card>
      </section>
    );
  }

  const quest = questResult.data;
  const tasks = tasksResult.data ?? [];

  return (
    <section className="space-y-8 text-white">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            Teacher Test Mode
          </p>
          <h1 className="mt-2 text-4xl font-bold">{quest.title}</h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            This is a teacher-only test run. Answers and results are not
            persisted yet.
          </p>
        </div>

        <QuestWorkspaceNav questId={id} active="play" />
      </div>

      {tasks.length === 0 ? (
        <Card className="text-center">
          <h2 className="text-2xl font-semibold">No tasks yet</h2>
          <p className="mt-3 text-slate-400">
            Add tasks before starting a teacher test run.
          </p>
          <Link
            href={`/quests/${id}/tasks`}
            className="mt-6 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Edit tasks
          </Link>
        </Card>
      ) : (
        <QuestRunner tasks={tasks} />
      )}
    </section>
  );
}
