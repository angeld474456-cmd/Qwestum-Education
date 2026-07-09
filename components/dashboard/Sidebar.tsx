import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0B1220] p-6">
      <h2 className="text-3xl font-bold text-white">
        Questum
      </h2>

      <p className="mt-2 text-slate-400">
        Education Platform
      </p>

      <nav className="mt-10 space-y-4">
        <Link href="/dashboard" className="block text-slate-300 hover:text-white">
          Главная
        </Link>

        <Link href="/dashboard/quests" className="block text-slate-300 hover:text-white">
          Библиотека квестов
        </Link>

        <Link href="/catalog" className="block text-slate-300 hover:text-white">
          Каталог
        </Link>

        <Link href="/students" className="block text-slate-300 hover:text-white">
          Ученики
        </Link>

        <Link href="/schools" className="block text-slate-300 hover:text-white">
          Школы
        </Link>

        <Link href="/settings" className="block text-slate-300 hover:text-white">
          Настройки
        </Link>
      </nav>
    </aside>
  );
}
