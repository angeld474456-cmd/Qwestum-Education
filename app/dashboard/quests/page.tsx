"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import Card from "@/components/ui/Card";
import {
  getAllQuestTasks,
  getQuests,
  Quest,
} from "@/services/quest.service";

type QuestTaskCountSource = {
  id: string;
  quest_id: string;
};

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

export default function TeacherQuestLibraryPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [tasks, setTasks] = useState<QuestTaskCountSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadTeacherLibrary() {
      setLoading(true);
      setErrorMessage("");

      const [questsResult, tasksResult] = await Promise.all([
        getQuests(),
        getAllQuestTasks(),
      ]);

      if (questsResult.error) {
        console.error(questsResult.error);
        setErrorMessage("Unable to load quests.");
        setLoading(false);
        return;
      }

      if (tasksResult.error) {
        console.error(tasksResult.error);
        setErrorMessage("Quests loaded, but task counts are unavailable.");
      }

      setQuests(questsResult.data ?? []);
      setTasks((tasksResult.data ?? []) as QuestTaskCountSource[]);
      setLoading(false);
    }

    loadTeacherLibrary();
  }, []);

  const taskCountsByQuestId = useMemo(() => {
    return tasks.reduce<Record<string, number>>((counts, task) => {
      counts[task.quest_id] = (counts[task.quest_id] ?? 0) + 1;
      return counts;
    }, {});
  }, [tasks]);

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

      {loading ? (
        <Card>
          <p className="text-slate-300">Loading quest library...</p>
        </Card>
      ) : null}

      {!loading && errorMessage ? (
        <Card className="border-red-500/40 bg-red-500/10">
          <h2 className="text-xl font-semibold text-red-100">
            Something went wrong
          </h2>

          <p className="mt-2 text-red-200">{errorMessage}</p>
        </Card>
      ) : null}

      {!loading && !errorMessage && quests.length === 0 ? (
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
      ) : null}

      {!loading && quests.length > 0 ? (
        <div className="grid gap-6">
          {quests.map((quest) => {
            const taskCount = taskCountsByQuestId[quest.id] ?? 0;

            return (
              <Card key={quest.id}>
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
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
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/quests/${quest.id}`}
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
      ) : null}
    </section>
  );
}
