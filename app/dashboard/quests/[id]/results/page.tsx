import { notFound } from "next/navigation";

import QuestWorkspaceNav from "@/components/dashboard/QuestWorkspaceNav";
import TeacherQuestResultsList from "@/components/dashboard/TeacherQuestResultsList";
import { getOwnedQuest } from "@/services/teacher-quest.server";
import {
  listTeacherQuestAttemptSummaries,
  TeacherQuestResultsServiceError,
} from "@/services/teacher-quest-results.server";

type TeacherQuestResultsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TeacherQuestResultsPage({
  params,
}: TeacherQuestResultsPageProps) {
  const { id } = await params;
  const quest = await getOwnedQuest(id);

  if (!quest) {
    notFound();
  }

  let attempts = null;

  try {
    attempts = await listTeacherQuestAttemptSummaries(id, { limit: 20, offset: 0 });
  } catch (error) {
    if (!(error instanceof TeacherQuestResultsServiceError)) throw error;
  }

  return (
    <section className="space-y-8 text-white">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
            {"\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b"}
          </p>
          <h1 className="mt-2 text-4xl font-bold">{quest.title}</h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            {"\u0417\u0434\u0435\u0441\u044c \u043f\u043e\u044f\u0432\u043b\u044f\u044e\u0442\u0441\u044f \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043d\u043d\u044b\u0435 \u043f\u0440\u043e\u0445\u043e\u0436\u0434\u0435\u043d\u0438\u044f \u0443\u0447\u0435\u043d\u0438\u043a\u043e\u0432."}
          </p>
        </div>

        <QuestWorkspaceNav questId={id} active="results" />
      </div>

      <TeacherQuestResultsList attempts={attempts} />
    </section>
  );
}
