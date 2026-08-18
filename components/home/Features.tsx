import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";

const features = [
  { step: "01", title: "Выберите или создайте квест", text: "Откройте готовый учебный квест из каталога или подготовьте свой для урока." },
  { step: "02", title: "Пройдите задания", text: "Выбирайте ответы, работайте с текстовыми заданиями и изучайте материалы с изображениями." },
  { step: "03", title: "Получите результат", text: "После завершения сразу виден результат; в личном кабинете ученика сохраняется история прохождений." },
];

export default function Features() {
  return (
    <section id="how-it-works" className="border-t border-slate-800 py-16 sm:py-24">
      <Container>
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-300">Как это работает</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">От идеи до результата за несколько шагов</h2>
          <p className="mt-4 text-lg leading-8 text-slate-400">Всё необходимое для первого интерактивного занятия — в одном месте.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <p className="text-sm font-bold text-violet-300">{feature.step}</p>
              <h3 className="mt-4 text-xl font-bold">{feature.title}</h3>
              <p className="mt-3 leading-7 text-slate-300">{feature.text}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
