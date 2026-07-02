const quests = [
  "Древний Египет",
  "Тайны Вселенной",
  "Путешествие по Казахстану",
  "Формулы Алгебры",
];

export default function RecentQuests() {
  return (
    <div className="rounded-3xl bg-[#111827] p-6">
      <h2 className="mb-6 text-2xl font-bold text-white">
        Последние квесты
      </h2>

      <div className="space-y-4">
        {quests.map((quest) => (
          <div
            key={quest}
            className="flex items-center justify-between rounded-xl bg-[#1B2435] p-4"
          >
            <span className="text-white">{quest}</span>

            <button className="text-violet-400 hover:text-violet-300">
              Открыть →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}