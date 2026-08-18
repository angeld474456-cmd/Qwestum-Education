import type { Metadata } from "next";
import Link from "next/link";

import LearnerAttemptResult from "@/components/learn/LearnerAttemptResult";
import { getStudentAttemptHistoryDetail } from "@/services/student-attempt-history.server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Результат прохождения",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ attemptId: string }> };

function UnavailableAttempt() {
  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-800 bg-[#111827] p-8 text-center">
        <h1 className="text-2xl font-semibold">Результат недоступен</h1>
        <p className="mt-3 text-slate-400">Этот результат не найден или недоступен для вашей учётной записи.</p>
        <Link href="/learn" className="mt-6 inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white">
          Назад в кабинет
        </Link>
      </section>
    </main>
  );
}

export default async function LearnerAttemptHistoryPage({ params }: PageProps) {
  const { attemptId } = await params;
  let attempt = null;

  try {
    attempt = await getStudentAttemptHistoryDetail(attemptId);
  } catch {}

  return attempt ? <LearnerAttemptResult attempt={attempt} /> : <UnavailableAttempt />;
}
