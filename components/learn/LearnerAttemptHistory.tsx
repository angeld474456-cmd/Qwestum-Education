import Link from "next/link";

import type { StudentAttemptHistoryResult } from "@/types/student-attempt-history";

type LearnerAttemptHistoryProps = {
  history: StudentAttemptHistoryResult | null;
};

function formatCompletionDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function LearnerAttemptHistory({
  history,
}: LearnerAttemptHistoryProps) {
  const unavailable = history === null;
  const empty = !unavailable && history.items.length === 0;

  return (
    <section aria-labelledby="learner-history-heading" className="space-y-4">
      <div>
        <h2 id="learner-history-heading" className="text-2xl font-bold text-white">
          Мои результаты
        </h2>
        <p className="mt-2 text-slate-400">Завершённые прохождения квестов.</p>
      </div>

      {unavailable ? (
        <p className="rounded-lg border border-slate-800 bg-[#111827] p-5 text-slate-400">
          Не удалось загрузить историю результатов.
        </p>
      ) : empty ? (
        <p className="rounded-lg border border-slate-800 bg-[#111827] p-5 text-slate-400">
          У вас пока нет завершённых прохождений.
        </p>
      ) : (
        <ol className="grid gap-3">
          {history.items.map((attempt) => (
          <li key={attempt.attemptId} className="rounded-lg border border-slate-800 bg-[#111827] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{attempt.questTitle}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {formatCompletionDate(attempt.submittedAt)}
                </p>
              </div>
              <p className="text-lg font-bold text-violet-200">
                {attempt.earnedPoints} / {attempt.possiblePoints}
              </p>
            </div>
            <p className="mt-4 text-sm text-slate-300">
              Верно: {attempt.correctCount} · Неверно: {attempt.incorrectCount} · Без ответа: {attempt.unansweredCount}
            </p>
            <Link
              href={`/learn/history/${attempt.attemptId}`}
              className="mt-4 inline-flex text-sm font-semibold text-violet-300 transition hover:text-violet-200 focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              Открыть результат
            </Link>
          </li>
          ))}
        </ol>
      )}
    </section>
  );
}
