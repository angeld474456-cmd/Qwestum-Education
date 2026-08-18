import Link from "next/link";

import Container from "@/components/ui/Container";

export default function Hero() {
  return (
    <section>
      <Container>
        <div className="flex min-h-[72vh] flex-col justify-center py-16 text-center sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-300">
            Интерактивные учебные квесты
          </p>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
            Учёба превращается в квест
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
            Создавайте интерактивные квесты для уроков или выбирайте готовые. Ученики проходят задания, получают результат и сохраняют историю своих достижений.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/catalog" className="rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white outline-none transition hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-300">
              Открыть каталог
            </Link>
            <Link href="/login" className="rounded-lg border border-slate-600 px-6 py-3 font-semibold text-slate-100 outline-none transition hover:border-slate-400 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-300">
              Войти
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
