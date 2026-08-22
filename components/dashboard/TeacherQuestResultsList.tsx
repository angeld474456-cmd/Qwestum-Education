import type { TeacherQuestAttemptSummary } from "@/types/teacher-quest-results";

type TeacherQuestResultsListProps = {
  attempts: TeacherQuestAttemptSummary[] | null;
};

function formatCompletionDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function TeacherQuestResultsList({
  attempts,
}: TeacherQuestResultsListProps) {
  if (attempts === null) {
    return (
      <section className="rounded-lg border border-slate-800 bg-[#111827] p-5 text-slate-400">
        {"\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b."}
      </section>
    );
  }

  if (attempts.length === 0) {
    return (
      <section className="rounded-lg border border-slate-800 bg-[#111827] p-6 text-center">
        <h2 className="text-2xl font-semibold text-white">
          {"\u042d\u0442\u043e\u0442 \u043a\u0432\u0435\u0441\u0442 \u043f\u043e\u043a\u0430 \u043d\u0438\u043a\u0442\u043e \u043d\u0435 \u043f\u0440\u043e\u0448\u0451\u043b."}
        </h2>
        <p className="mt-3 text-slate-400">
          {"\u041f\u043e\u0441\u043b\u0435 \u043f\u0440\u043e\u0445\u043e\u0436\u0434\u0435\u043d\u0438\u044f \u0443\u0447\u0435\u043d\u0438\u043a\u0430\u043c\u0438 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u0437\u0434\u0435\u0441\u044c."}
        </p>
      </section>
    );
  }

  return (
    <section aria-label={"\u0421\u043f\u0438\u0441\u043e\u043a \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u043e\u0432"}>
      <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(11rem,1fr)_minmax(7rem,0.6fr)_minmax(6rem,0.4fr)] gap-4 border-b border-slate-800 px-5 py-3 text-sm font-semibold text-slate-400 md:grid">
        <span>{"\u0423\u0447\u0435\u043d\u0438\u043a"}</span>
        <span>{"\u0414\u0430\u0442\u0430"}</span>
        <span>{"\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442"}</span>
        <span>{"\u041f\u0440\u043e\u0446\u0435\u043d\u0442"}</span>
      </div>

      <ol className="space-y-3 md:space-y-0">
        {attempts.map((attempt) => (
          <li
            key={attempt.attemptId}
            className="grid gap-3 rounded-lg border border-slate-800 bg-[#111827] p-5 md:grid-cols-[minmax(0,1.4fr)_minmax(11rem,1fr)_minmax(7rem,0.6fr)_minmax(6rem,0.4fr)] md:items-center md:rounded-none md:border-x-0 md:border-t-0"
          >
            <div>
              <p className="text-sm font-semibold text-slate-400 md:hidden">
                {"\u0423\u0447\u0435\u043d\u0438\u043a"}
              </p>
              <p className="font-semibold text-white">{attempt.studentDisplayName}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 md:hidden">
                {"\u0414\u0430\u0442\u0430"}
              </p>
              <p className="text-slate-300">{formatCompletionDate(attempt.submittedAt)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 md:hidden">
                {"\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442"}
              </p>
              <p className="font-semibold text-violet-200">
                {attempt.earnedPoints} / {attempt.possiblePoints}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 md:hidden">
                {"\u041f\u0440\u043e\u0446\u0435\u043d\u0442"}
              </p>
              <p className="font-semibold text-slate-200">
                {attempt.percentage === null ? "\u2014" : `${attempt.percentage}%`}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
