import type { Metadata } from "next";
import Link from "next/link";

import PublicQuestRunner from "@/components/public-runtime/PublicQuestRunner";
import { getPublicRuntimeQuest } from "@/services/public-runtime.server";
import { startStudentQuestAttempt } from "@/services/student-attempt.server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Прохождение квеста",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ id: string }> };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function UnavailableQuest() {
  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-800 bg-[#111827] p-8 text-center">
        <h1 className="text-2xl font-semibold">Квест недоступен для прохождения</h1>
        <p className="mt-3 text-slate-400">
          Квест мог быть изменен, снят с публикации или недоступен для вашего аккаунта.
        </p>
        <Link
          href="/learn"
          className="mt-6 inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          К доступным квестам
        </Link>
      </section>
    </main>
  );
}

export default async function LearnerQuestStartPage({ params }: PageProps) {
  const { id } = await params;

  if (!uuidPattern.test(id)) return <UnavailableQuest />;

  let quest = null;
  let attempt = null;

  try {
    quest = await getPublicRuntimeQuest(id);
    attempt = quest ? await startStudentQuestAttempt(id) : null;
  } catch {}

  if (!quest || !attempt) return <UnavailableQuest />;

  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white">
      <PublicQuestRunner
        quest={quest}
        submitUrl={`/api/learn/attempts/${attempt.attemptId}/submit`}
        retryHref={`/learn/quests/${quest.id}/start`}
        catalogHref="/learn"
      />
    </main>
  );
}
