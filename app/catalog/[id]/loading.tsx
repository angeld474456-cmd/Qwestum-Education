export default function CatalogQuestLoading() {
  return (
    <main
      className="min-h-screen bg-[#070B14] px-6 py-12 text-white"
      aria-busy="true"
    >
      <div className="mx-auto max-w-5xl space-y-6" role="status" aria-live="polite">
        <p className="text-sm font-medium text-slate-300">
          {"\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u043a\u0432\u0435\u0441\u0442\u2026"}
        </p>
        <div
          aria-hidden="true"
          className="aspect-video animate-pulse rounded-lg bg-slate-900 motion-reduce:animate-none"
        />
        <div
          aria-hidden="true"
          className="h-10 w-3/4 animate-pulse rounded bg-slate-800 motion-reduce:animate-none"
        />
        <div
          aria-hidden="true"
          className="h-32 animate-pulse rounded-lg bg-slate-900 motion-reduce:animate-none"
        />
      </div>
    </main>
  );
}
