import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";

const plans = [
  {
    name: "Free",
    price: "0 ₸",
    features: [
      "3 квеста",
      "Базовые функции",
      "Один учитель"
    ]
  },
  {
    name: "Teacher",
    price: "9 900 ₸",
    popular: true,
    features: [
      "Безлимитные квесты",
      "AI-помощник",
      "Экспорт PDF",
      "Личный кабинет"
    ]
  },
  {
    name: "School",
    price: "По запросу",
    features: [
      "Все кабинеты",
      "Аналитика",
      "Администратор",
      "Поддержка"
    ]
  }
];

export default function Pricing() {
  return (
    <section className="py-32">
      <Container>

        <div className="text-center">

          <div className="uppercase tracking-[0.3em] text-violet-400 font-semibold">
            Тарифы
          </div>

          <h2 className="mt-6 text-5xl font-black">
            Выберите подходящий план
          </h2>

        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">

          {plans.map((plan) => (

            <Card key={plan.name}>

              {plan.popular && (
                <div className="mb-6 inline-block rounded-full bg-violet-600 px-4 py-2 text-sm">
                  Популярный
                </div>
              )}

              <h3 className="text-3xl font-bold">
                {plan.name}
              </h3>

              <div className="mt-6 text-5xl font-black text-violet-400">
                {plan.price}
              </div>

              <ul className="mt-8 space-y-4 text-gray-400">

                {plan.features.map((feature) => (
                  <li key={feature}>✔ {feature}</li>
                ))}

              </ul>

              <button className="mt-10 w-full rounded-2xl bg-violet-600 py-4 font-bold hover:bg-violet-500 transition">
                Выбрать
              </button>

            </Card>

          ))}

        </div>

      </Container>
    </section>
  );
}