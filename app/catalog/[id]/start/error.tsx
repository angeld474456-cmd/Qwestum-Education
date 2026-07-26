"use client";

import Link from "next/link";

type PublicQuestStartErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function PublicQuestStartError({
  unstable_retry,
}: PublicQuestStartErrorProps) {
  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-800 bg-[#111827] p-8 text-center">
        <h1 className="text-2xl font-semibold">
          {"\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043a\u0432\u0435\u0441\u0442"}
        </h1>
        <p className="mt-3 text-slate-400">
          {"\u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u043f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0443 \u0438\u043b\u0438 \u0432\u0435\u0440\u043d\u0438\u0442\u0435\u0441\u044c \u0432 \u043a\u0430\u0442\u0430\u043b\u043e\u0433."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={unstable_retry} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-400">
            {"\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c"}
          </button>
          <Link href="/catalog" className="inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400">
            {"\u0412 \u043a\u0430\u0442\u0430\u043b\u043e\u0433"}
          </Link>
        </div>
      </section>
    </main>
  );
}
