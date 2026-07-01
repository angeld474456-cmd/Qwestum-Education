import Container from "@/components/ui/Container";

const features = [
  {
    title: "Кабинет директора",
    text: "Полная статистика школы, классов, учителей и учеников."
  },
  {
    title: "Кабинет учителя",
    text: "Создание уроков, проверка результатов и управление классами."
  },
  {
    title: "Кабинет ученика",
    text: "Прохождение квестов, достижения и рейтинг."
  },
  {
    title: "Аналитика",
    text: "Автоматические отчёты по успеваемости."
  }
];

export default function Schools() {
  return (
    <section className="py-32">

      <Container>

        <div className="grid gap-20 lg:grid-cols-2 items-center">

          <div>

            <div className="uppercase tracking-[0.3em] text-violet-400 font-semibold">
              Для школ
            </div>

            <h2 className="mt-6 text-5xl font-black leading-tight">
              Вся школа
              <br />
              в одном кабинете
            </h2>

            <p className="mt-8 text-xl leading-9 text-gray-400">
              Questum объединяет администрацию, учителей,
              учеников и родителей в единую образовательную
              экосистему.
            </p>

            <button className="mt-12 rounded-2xl bg-violet-600 px-10 py-5 font-bold hover:bg-violet-500 transition">
              Запросить демонстрацию
            </button>

          </div>

          <div className="grid gap-6">

            {features.map((item) => (

              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
              >

                <h3 className="text-2xl font-bold">
                  {item.title}
                </h3>

                <p className="mt-4 leading-8 text-gray-400">
                  {item.text}
                </p>

              </div>

            ))}

          </div>

        </div>

      </Container>

    </section>
  );
}