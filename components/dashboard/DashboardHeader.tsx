export default function DashboardHeader() {
  return (
    <header className="border-b border-slate-800 bg-[#0B1220] px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Панель управления
          </h1>

          <p className="mt-2 text-slate-400">
            Добро пожаловать в Questum
          </p>
        </div>

        <button className="rounded-xl bg-violet-600 px-6 py-3 text-white hover:bg-violet-700">
          + Создать квест
        </button>
      </div>
    </header>
  );
}