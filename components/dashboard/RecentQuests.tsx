const quests = [
  {
    title: "Тайны Древнего Египта",
    subject: "История",
    grade: "5 класс",
  },
  {
    title: "Формулы Алгебры",
    subject: "Алгебра",
    grade: "7 класс",
  },
  {
    title: "Путешествие по Казахстану",
    subject: "География",
    grade: "6 класс",
  },
];

export default function RecentQuests() {
  return (
    <section className="rounded-3xl bg-[#111827] p-8">

      <h2 className="text-2xl font-bold text-white mb-6">
        Последние квесты
      </h2>

      <div className="space-y-4">

        {quests.map((quest) => (
          <div
            key={quest.title}
            className="flex items-center justify-between rounded-2xl border border-slate-700 bg-[#1B2435] p-5"
          >
            <div>
              <h3 className="text-lg font-semibold text-white">
                {quest.title}
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                {quest.subject} • {quest.grade}
              </p>
            </div>

            <button className="rounded-xl bg-violet-600 px-5 py-2 text-white transition hover:bg-violet-700">
              Открыть
            </button>
          </div>
        ))}

      </div>

    </section>
  );
}