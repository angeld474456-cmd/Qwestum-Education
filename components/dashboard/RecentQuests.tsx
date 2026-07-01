const quests = [
  "Математический детектив",
  "Тайна древнего Египта",
  "Операция Лаборатория",
  "По следам Шёлкового пути",
];

export default function RecentQuests() {
  return (
    <section className="mt-14">

      <h2 className="mb-8 text-3xl font-black">
        Последние квесты
      </h2>

      <div className="space-y-5">

        {quests.map((quest) => (

          <div
            key={quest}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-violet-500"
          >
            {quest}
          </div>

        ))}

      </div>

    </section>
  );
}