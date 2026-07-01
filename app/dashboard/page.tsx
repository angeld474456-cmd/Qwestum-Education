export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#070B14] text-white">

      {/* Верхняя панель */}

      <header className="border-b border-slate-800 bg-[#0B1220]">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">

          <div>
            <h1 className="text-3xl font-bold">
              Добро пожаловать в Questum
            </h1>

            <p className="text-slate-400 mt-2">
              Ваш центр управления образовательными квестами
            </p>
          </div>

          <button className="rounded-xl bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-700 transition">
            + Создать квест
          </button>

        </div>
      </header>

      {/* Контент */}

      <section className="max-w-7xl mx-auto p-8">

        {/* Статистика */}

        <div className="grid lg:grid-cols-4 gap-6">

          <div className="rounded-3xl bg-[#111827] p-8">
            <p className="text-slate-400">Всего квестов</p>
            <h2 className="text-5xl font-bold mt-4">265</h2>
          </div>

          <div className="rounded-3xl bg-[#111827] p-8">
            <p className="text-slate-400">Учеников</p>
            <h2 className="text-5xl font-bold mt-4">1482</h2>
          </div>

          <div className="rounded-3xl bg-[#111827] p-8">
            <p className="text-slate-400">Школ</p>
            <h2 className="text-5xl font-bold mt-4">26</h2>
          </div>

          <div className="rounded-3xl bg-[#111827] p-8">
            <p className="text-slate-400">AI генераций</p>
            <h2 className="text-5xl font-bold mt-4">392</h2>
          </div>

        </div>

        {/* Последние квесты */}

        <div className="mt-10 rounded-3xl bg-[#111827] p-8">

          <h2 className="text-2xl font-bold mb-6">
            Последние квесты
          </h2>

          <div className="space-y-4">

            {[
              "Древний Египет",
              "Тайны Вселенной",
              "Путешествие по Казахстану",
              "Формулы Алгебры"
            ].map((quest) => (
              <div
                key={quest}
                className="rounded-2xl bg-[#1B2435] p-5 flex justify-between items-center"
              >
                <span>{quest}</span>

                <button className="text-violet-400 hover:text-violet-300">
                  Открыть →
                </button>
              </div>
            ))}

          </div>

        </div>

      </section>

    </main>
  );
}