import Link from "next/link";

export default function AccountUnavailablePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070B14] px-6 text-white">
      <section className="w-full max-w-lg rounded-lg border border-slate-800 bg-[#111827] p-8 text-center">
        <h1 className="text-2xl font-bold">
          {"\u0410\u043a\u043a\u0430\u0443\u043d\u0442 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d"}
        </h1>
        <p className="mt-3 text-slate-400">
          {"\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u043f\u0440\u043e\u0444\u0438\u043b\u044c. \u041e\u0431\u0440\u0430\u0442\u0438\u0442\u0435\u0441\u044c \u0432 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0443."}
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          {"\u0412 \u043a\u0430\u0442\u0430\u043b\u043e\u0433"}
        </Link>
      </section>
    </main>
  );
}
