export default function Header() {
  return (
    <header className="w-full border-b border-gray-800 bg-[#070B14]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        <div className="text-3xl font-black text-violet-400">
          QUESTUM
        </div>

        <nav className="flex gap-8 text-gray-300">
          <a href="#">Главная</a>
          <a href="#">Каталог</a>
          <a href="#">Для школ</a>
          <a href="#">Контакты</a>
        </nav>

        <button className="rounded-xl bg-violet-600 px-5 py-3 font-semibold">
          Войти
        </button>

      </div>
    </header>
  );
}