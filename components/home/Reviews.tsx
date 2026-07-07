import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";

const reviews = [
  {
    name: "Елена Сергеевна",
    role: "Директор школы",
    text: "Questum полностью изменил подход к проведению уроков. Учителя стали экономить огромное количество времени."
  },
  {
    name: "Александр Викторович",
    role: "Учитель математики",
    text: "AI помогает создавать квесты буквально за несколько минут. Ученики вовлечены намного сильнее."
  },
  {
    name: "Айдана",
    role: "Ученица 8 класса",
    text: "Теперь уроки похожи на настоящее приключение. Выполнять задания стало интересно."
  }
];

export default function Reviews() {
  return (
    <section className="py-32">
      <Container>

        <div className="text-center">

          <div className="uppercase tracking-[0.3em] text-violet-400 font-semibold">
            Отзывы
          </div>

          <h2 className="mt-6 text-5xl font-black">
            Что говорят пользователи
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-xl text-gray-400 leading-9">
            Первые школы уже используют игровые технологии
            для повышения вовлечённости учеников.
          </p>

        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">

          {reviews.map((review) => (

            <Card key={review.name}>

              <div className="text-yellow-400 text-xl">
                ★★★★★
              </div>

              <p className="mt-6 leading-8 text-gray-300">
                &quot;{review.text}&quot;
              </p>

              <div className="mt-10">

                <div className="font-bold text-xl">
                  {review.name}
                </div>

                <div className="text-gray-500">
                  {review.role}
                </div>

              </div>

            </Card>

          ))}

        </div>

      </Container>
    </section>
  );
}
