import Link from "next/link";

import Card from "@/components/ui/Card";
import {
  getOwnedQuests,
  getOwnedQuestTaskSummary,
} from "@/services/teacher-quest.server";

function formatCreatedAt(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default async function TeacherQuestLibraryPage() {
  const [quests, tasks] = await Promise.all([
    getOwnedQuests(),
    getOwnedQuestTaskSummary(),
  ]);

  const taskCountsByQuestId = tasks.reduce<Record<string, number>>(
    (counts, task) => {
      counts[task.quest_id] = (counts[task.quest_id] ?? 0) + 1;
      return counts;
    },
    {}
  );

  const totalQuests = quests.length;
  const publicQuests = quests.filter((quest) => quest.is_public).length;
  const totalTasks = tasks.length;
  const totalPoints = tasks.reduce(
    (sum, task) => sum + (Number(task.points) || 0),
    0
  );

  const libraryAnalytics = {
    totalQuests,
    publicQuests,
    draftQuests: totalQuests - publicQuests,
    totalTasks,
    totalPoints,
  };

  return (
    <section className="space-y-8 text-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Teacher Quest Library
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Manage your educational quests, open the editor, and prepare
            upcoming preview and play flows.
          </p>
        </div>

        <Link
          href="/quests/new"
          className="inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
        >
          Create new quest
        </Link>
      </div>

      {quests.length === 0 ? (
        <Card className="text-center">
          <h2 className="text-2xl font-semibold">
            No quests yet
          </h2>

          <p className="mt-3 text-slate-400">
            Create your first quest to start building the teacher library.
          </p>

          <Link
            href="/quests/new"
            className="mt-6 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Create new quest
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Total quests</p>
              <p className="mt-2 text-3xl font-bold">
                {libraryAnalytics.totalQuests}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Public quests</p>
              <p className="mt-2 text-3xl font-bold">
                {libraryAnalytics.publicQuests}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Draft quests</p>
              <p className="mt-2 text-3xl font-bold">
                {libraryAnalytics.draftQuests}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Total tasks</p>
              <p className="mt-2 text-3xl font-bold">
                {libraryAnalytics.totalTasks}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Total points</p>
              <p className="mt-2 text-3xl font-bold">
                {libraryAnalytics.totalPoints}
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {quests.map((quest) => {
              const taskCount = taskCountsByQuestId[quest.id] ?? 0;

              return (
                <Card key={quest.id}>
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <Link
                      href={`/dashboard/quests/${quest.id}/settings`}
                      className="min-w-0 rounded-xl outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold">
                          {quest.title}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${
                            quest.is_public
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {quest.is_public ? "Public" : "Draft"}
                        </span>
                      </div>

                      <p className="mt-3 max-w-3xl text-slate-400">
                        {quest.description || "No description provided."}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-300">
                        <span>Difficulty: {quest.difficulty ?? "Not available"}</span>
                        <span>Created: {formatCreatedAt(quest.created_at)}</span>
                        <span>Tasks: {taskCount}</span>
                      </div>
                    </Link>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/dashboard/quests/${quest.id}/settings`}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Open / Edit quest
                      </Link>

                      <Link
                        href={`/quests/${quest.id}/tasks`}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                      >
                        Edit tasks
                      </Link>

                      <Link
                        href={`/dashboard/quests/${quest.id}/preview`}
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                      >
                        Preview
                      </Link>

                      <Link
                        href={`/dashboard/quests/${quest.id}/play`}
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                      >
                        Play/Test
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
