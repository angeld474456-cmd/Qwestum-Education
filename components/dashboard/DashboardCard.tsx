type DashboardCardProps = {
  title: string;
  value: string;
};

export default function DashboardCard({
  title,
  value,
}: DashboardCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <p className="text-gray-400">{title}</p>

      <h2 className="mt-3 text-4xl font-black text-violet-400">
        {value}
      </h2>
    </div>
  );
}