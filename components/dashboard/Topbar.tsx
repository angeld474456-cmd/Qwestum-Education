export default function Topbar() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-white/10 px-10">

      <div>

        <h1 className="text-3xl font-black">
          Добро пожаловать 👋
        </h1>

        <p className="text-gray-400">
          Панель управления Questum
        </p>

      </div>

      <div className="flex items-center gap-5">

        <button className="rounded-xl bg-violet-600 px-5 py-3 hover:bg-violet-500">
          AI Генератор
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 font-bold">
          A
        </div>

      </div>

    </header>
  );
}