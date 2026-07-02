export default function QuickActions() {
  return (
    <div className="rounded-3xl bg-[#111827] p-6">
      <h2 className="mb-6 text-2xl font-bold text-white">
        Быстрые действия
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        <button className="rounded-xl bg-violet-600 p-5 text-white hover:bg-violet-700">
          Создать квест
        </button>

        <button className="rounded-xl bg-slate-700 p-5 text-white hover:bg-slate-600">
          AI Генератор
        </button>

        <button className="rounded-xl bg-slate-700 p-5 text-white hover:bg-slate-600">
          Добавить класс
        </button>

        <button className="rounded-xl bg-slate-700 p-5 text-white hover:bg-slate-600">
          Пригласить учителя
        </button>
      </div>
    </div>
  );
}