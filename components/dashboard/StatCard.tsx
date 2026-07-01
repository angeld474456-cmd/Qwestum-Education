type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
};

export default function StatCard({
  title,
  value,
  subtitle,
}: StatCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-[#111827] p-6 transition hover:border-violet-500 hover:-translate-y-1">
      <p className="text-sm uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <h2 className="mt-4 text-5xl font-bold text-white">
        {value}
      </h2>

      {subtitle && (
        <p className="mt-3 text-sm text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}