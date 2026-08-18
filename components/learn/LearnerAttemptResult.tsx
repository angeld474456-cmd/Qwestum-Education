import Link from "next/link";

import PublicTaskImage from "@/components/public-runtime/PublicTaskImage";
import type {
  StudentAttemptHistoryDetail,
  StudentAttemptHistoryTask,
} from "@/types/student-attempt-history";

type LearnerAttemptResultProps = {
  attempt: StudentAttemptHistoryDetail;
};

const statusLabels = {
  correct: "Верно",
  incorrect: "Неверно",
  unanswered: "Без ответа",
  not_scored: "Не оценивается",
} as const;

function formatCompletionDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function TaskOptions({ task }: { task: Exclude<StudentAttemptHistoryTask, { taskType: "text" }> }) {
  const selectedIds = new Set(
    task.taskType === "single_choice"
      ? task.selectedOptionId ? [task.selectedOptionId] : []
      : task.selectedOptionIds
  );

  return (
    <ul className="space-y-2" aria-label="Выбранные варианты">
      {task.options.map((option) => {
        const selected = selectedIds.has(option.id);

        return (
          <li
            key={option.id}
            className={`rounded-md border p-3 text-sm ${selected ? "border-violet-500 bg-violet-500/10 text-violet-100" : "border-slate-700 bg-slate-900 text-slate-300"}`}
          >
            {option.text}
            {selected ? <span className="ml-2 text-xs font-semibold">Ваш выбор</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function LearnerAttemptResult({ attempt }: LearnerAttemptResultProps) {
  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-lg border border-slate-800 bg-[#111827] p-6 sm:p-8">
          <p className="text-sm text-slate-400">{formatCompletionDate(attempt.submittedAt)}</p>
          <h1 className="mt-2 text-3xl font-bold">{attempt.questTitle}</h1>
          <p className="mt-5 text-xl font-semibold text-violet-200">
            Баллы: {attempt.earnedPoints} / {attempt.possiblePoints}
          </p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-700 bg-slate-900 p-4"><dt className="text-sm text-slate-400">Верно</dt><dd className="mt-1 text-2xl font-bold">{attempt.correctCount}</dd></div>
            <div className="rounded-md border border-slate-700 bg-slate-900 p-4"><dt className="text-sm text-slate-400">Неверно</dt><dd className="mt-1 text-2xl font-bold">{attempt.incorrectCount}</dd></div>
            <div className="rounded-md border border-slate-700 bg-slate-900 p-4"><dt className="text-sm text-slate-400">Без ответа</dt><dd className="mt-1 text-2xl font-bold">{attempt.unansweredCount}</dd></div>
            <div className="rounded-md border border-slate-700 bg-slate-900 p-4"><dt className="text-sm text-slate-400">Не оценивается</dt><dd className="mt-1 text-2xl font-bold">{attempt.notScoredCount}</dd></div>
          </dl>
        </section>

        <ol className="space-y-4">
          {attempt.tasks.map((task) => (
            <li key={task.sourceTaskId} className="rounded-lg border border-slate-800 bg-[#111827] p-5">
              <p className="text-sm text-slate-400">Задание {task.taskOrder}</p>
              <h2 className="mt-1 text-xl font-semibold">{task.title}</h2>
              {task.description ? <p className="mt-3 whitespace-pre-wrap text-slate-300">{task.description}</p> : null}
              <div className="mt-4"><PublicTaskImage imageUrl={task.imageUrl} title={task.title} /></div>
              {task.taskType === "text" ? (
                <p className="mt-4 text-sm text-slate-300">Ответ на это задание не оценивается автоматически.</p>
              ) : (
                <div className="mt-4"><TaskOptions task={task} /></div>
              )}
              <p className="mt-4 text-sm text-slate-300">
                {statusLabels[task.status]} · {task.earnedPoints} / {task.possiblePoints}
              </p>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-3">
          <a href={`/learn/quests/${attempt.questId}/start`} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700">
            Пройти ещё раз
          </a>
          <Link href="/learn" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white">
            Назад в кабинет
          </Link>
        </div>
      </div>
    </main>
  );
}
