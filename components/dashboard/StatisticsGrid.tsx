import StatCard from "./StatCard";

export default function StatisticsGrid() {
  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

      <StatCard
        title="Квестов"
        value="265"
        subtitle="Опубликовано"
      />

      <StatCard
        title="Учителей"
        value="124"
        subtitle="Активных"
      />

      <StatCard
        title="Школ"
        value="26"
        subtitle="Подключено"
      />

      <StatCard
        title="AI"
        value="392"
        subtitle="Генераций"
      />

    </section>
  );
}