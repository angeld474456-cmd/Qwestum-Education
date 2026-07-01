const actions = [
  "➕ Создать новый квест",
  "🤖 AI Генератор",
  "📚 Открыть каталог",
  "👨‍🎓 Добавить класс",
];

export default function QuickActions() {
  return (
    <section className="mt-10">

      <h2 className="mb-8 text-3xl font-black">
        Быстрые действия
      </h2>

      <div className="grid gap-6 md:grid-cols-2">

        {actions.map((action) => (

          <button
            key={action}
            className="rounded-3xl border border-white/10 bg-white/5 p-8 text-left text-xl backdrop-blur transition hover:border-violet-500 hover:bg-violet-600"
          >
            {action}
          </button>

        ))}

      </div>

    </section>
  );
}