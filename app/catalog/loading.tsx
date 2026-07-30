export default function CatalogLoading() {
  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white" aria-busy="true">
      <div className="mx-auto max-w-7xl space-y-8">
        <p role="status" aria-live="polite" className="text-sm font-medium text-slate-300">
          {"\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u043a\u0430\u0442\u0430\u043b\u043e\u0433 \u043a\u0432\u0435\u0441\u0442\u043e\u0432\u2026"}
        </p>
        <div aria-hidden="true" className="h-8 w-64 animate-pulse rounded bg-slate-800 motion-reduce:animate-none" />
        <div aria-hidden="true" className="h-32 animate-pulse rounded-lg bg-slate-900 motion-reduce:animate-none" />
        <div aria-hidden="true" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-lg bg-slate-900 motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
