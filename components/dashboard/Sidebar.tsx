export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#0B1220] border-r border-slate-800 p-6">
      <h2 className="text-3xl font-bold text-white">
        Questum
      </h2>

      <p className="mt-2 text-slate-400">
        Education Platform
      </p>

      <nav className="mt-10 space-y-4">
        <a href="/dashboard" className="block text-slate-300 hover:text-white">
          🏠 Главная
        </a>

        <a href="/catalog" className="block text-slate-300 hover:text-white">
          📚 Каталог
        </a>

        <a href="/students" className="block text-slate-300 hover:text-white">
          👨‍🎓 Ученики
        </a>

        <a href="/schools" className="block text-slate-300 hover:text-white">
          🏫 Школы
        </a>

        <a href="/settings" className="block text-slate-300 hover:text-white">
          ⚙ Настройки
        </a>
      </nav>
    </aside>
  );
}