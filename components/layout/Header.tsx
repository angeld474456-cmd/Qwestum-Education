import Link from "next/link";

const subjects = [
  { label: "История Казахстана", href: "/catalog?subject=История%20Казахстана" },
  { label: "Математика", href: "/catalog?subject=Математика" },
  { label: "Английский язык", href: "/catalog?subject=Английский%20язык" },
];

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-[#070B14]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-black text-violet-300 outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:text-2xl">
          Qwestum-Education
        </Link>
        <nav aria-label="Основная навигация" className="flex items-center gap-2 text-sm sm:gap-5 sm:text-base">
          <Link href="/catalog" className="rounded-lg px-3 py-2 text-slate-300 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400">
            Каталог
          </Link>
          <Link href="/#how-it-works" className="hidden rounded-lg px-3 py-2 text-slate-300 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400 md:inline-flex">
            Как это работает
          </Link>
          <details className="relative hidden md:block">
            <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-slate-300 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400">
              Предметы
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-slate-700 bg-[#111827] p-2 shadow-xl">
              <Link href="/catalog" className="block rounded-md px-3 py-2 text-sm font-semibold text-white outline-none hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-violet-400">
                Все предметы
              </Link>
              {subjects.map((subject) => (
                <Link key={subject.href} href={subject.href} className="block rounded-md px-3 py-2 text-sm text-slate-300 outline-none hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400">
                  {subject.label}
                </Link>
              ))}
            </div>
          </details>
        </nav>
        <Link href="/login" className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-300 sm:px-5">
          Войти
        </Link>
      </div>
    </header>
  );
}
