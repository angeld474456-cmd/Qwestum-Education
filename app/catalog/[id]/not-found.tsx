import Link from "next/link";

export default function CatalogQuestNotFound() {
  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-800 bg-[#111827] p-8 text-center">
        <h1 className="text-2xl font-semibold">Квест недоступен</h1>
        <p className="mt-3 text-slate-400">
          Квест не найден или больше не доступен в каталоге.
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          Вернуться к каталогу
        </Link>
      </section>
    </main>
  );
}
