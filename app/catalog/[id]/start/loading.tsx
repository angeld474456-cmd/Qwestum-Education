export default function PublicQuestStartLoading() {
  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white" aria-busy="true">
      <section role="status" aria-live="polite" className="mx-auto max-w-3xl rounded-lg border border-slate-800 bg-[#111827] p-8 text-center text-slate-300">
        {"\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u043a\u0432\u0435\u0441\u0442\u2026"}
      </section>
    </main>
  );
}
