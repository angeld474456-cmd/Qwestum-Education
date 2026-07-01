import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";

const features = [
  {
    icon: "🎯",
    title: "Обучение через игру",
    text: "Каждый урок превращается в увлекательное приключение, которое удерживает внимание учеников."
  },
  {
    icon: "🤖",
    title: "Искусственный интеллект",
    text: "AI помогает создавать новые образовательные квесты за считанные секунды."
  },
  {
    icon: "📚",
    title: "321 готовый квест",
    text: "Библиотека постоянно расширяется и охватывает все основные предметы."
  },
  {
    icon: "📈",
    title: "Аналитика",
    text: "Учитель видит результаты прохождения, статистику и прогресс каждого ученика."
  },
  {
    icon: "🏫",
    title: "Для школ",
    text: "Единая система для всей школы с кабинетами учителей, учеников и администрации."
  },
  {
    icon: "☁️",
    title: "Работает в браузере",
    text: "Никаких установок. Любое устройство — компьютер, планшет или смартфон."
  }
];

export default function Features() {
  return (
    <section className="py-32">

      <Container>

        <div className="mb-20 text-center">

          <div className="text-violet-400 font-semibold uppercase tracking-[0.3em]">
            Возможности
          </div>

          <h2 className="mt-6 text-5xl font-black">
            Почему школы выбирают Questum
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-xl leading-9 text-gray-400">
            Мы объединяем игровой формат обучения,
            искусственный интеллект и современную платформу
            в одном продукте.
          </p>

        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">

          {features.map((feature) => (

            <Card key={feature.title}>

              <div className="text-6xl">
                {feature.icon}
              </div>

              <h3 className="mt-8 text-3xl font-bold">
                {feature.title}
              </h3>

              <p className="mt-5 leading-8 text-gray-400">
                {feature.text}
              </p>

            </Card>

          ))}

        </div>

      </Container>

    </section>
  );
}