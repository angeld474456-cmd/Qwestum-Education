import Container from "@/components/ui/Container";

const steps = [
  {
    number: "01",
    title: "Выберите предмет",
    text: "Найдите нужную дисциплину, класс и тему из каталога Questum."
  },
  {
    number: "02",
    title: "Создайте квест",
    text: "Используйте готовый шаблон или попросите AI создать новый сценарий."
  },
  {
    number: "03",
    title: "Проведите урок",
    text: "Ученики проходят квест, а система автоматически собирает результаты."
  }
];

export default function HowItWorks() {
  return (
    <section className="py-32">
      <Container>

        <div className="text-center">

          <div className="font-semibold uppercase tracking-[0.3em] text-violet-400">
            Как это работает
          </div>

          <h2 className="mt-6 text-5xl font-black">
            Три простых шага
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-xl text-gray-400">
            Questum помогает провести современный урок без долгой подготовки.
          </p>

        </div>

        <div className="mt-24 grid gap-10 lg:grid-cols-3">

          {steps.map((step) => (

            <div
              key={step.number}
              className="relative rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-violet-500/40"
            >

              <div className="absolute right-8 top-8 text-7xl font-black text-violet-600/20">
                {step.number}
              </div>

              <div className="text-2xl font-bold text-violet-400">
                Шаг {step.number}
              </div>

              <h3 className="mt-8 text-3xl font-bold">
                {step.title}
              </h3>

              <p className="mt-6 leading-8 text-gray-400">
                {step.text}
              </p>

            </div>

          ))}

        </div>

      </Container>
    </section>
  );
}