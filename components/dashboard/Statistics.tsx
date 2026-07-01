import DashboardCard from "./DashboardCard";

export default function Statistics() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <DashboardCard title="Мои квесты" value="321" />
      <DashboardCard title="Классы" value="12" />
      <DashboardCard title="Ученики" value="286" />
      <DashboardCard title="AI-запросы" value="98" />
    </div>
  );
}