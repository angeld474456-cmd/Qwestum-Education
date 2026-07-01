const menu = [
  "Главная",
  "Каталог квестов",
  "AI Генератор",
  "Мои классы",
  "Ученики",
  "Статистика",
  "Материалы",
  "Настройки",
];

export default function Sidebar() {
  return (
    <aside className="w-72 border-r border-white/10 bg-[#090F1A] p-8">
      <h1 className="text-3xl font-black text-violet-400">
        QUESTUM
      </h1>

      <nav className="mt-12 space-y-3">
        {menu.map((item) => (
          <button
            key={item}
            className="w-full rounded-2xl px-5 py-4 text-left transition hover:bg-violet-600"
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}