export default function CatalogLoading() {
  return (
    <main className="min-h-screen bg-[#070B14] px-6 py-12 text-white" aria-busy="true">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-800" />
        <div className="h-32 animate-pulse rounded-lg bg-slate-900" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-lg bg-slate-900"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
