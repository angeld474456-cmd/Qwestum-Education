import Container from "@/components/ui/Container";

export default function AISection() {
  return (
    <section className="py-32">

      <Container>

        <div className="grid items-center gap-20 lg:grid-cols-2">

          <div>

            <div className="font-semibold uppercase tracking-[0.3em] text-violet-400">
              AI QUESTUM
            </div>

            <h2 className="mt-6 text-5xl font-black leading-tight">
              Создавайте квесты
              <br />
              за 30 секунд
            </h2>

            <p className="mt-8 text-xl leading-9 text-gray-400">
              Искусственный интеллект поможет создать полноценный
              образовательный квест по любой теме школьной программы.
            </p>

            <ul className="mt-10 space-y-5 text-lg">

              <li>✅ Генерация заданий</li>

              <li>✅ Подбор изображений</li>

              <li>✅ Создание головоломок</li>

              <li>✅ Проверка соответствия программе</li>

              <li>✅ PDF для печати</li>

            </ul>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">

            <div className="mb-8 flex items-center gap-3">

              <div className="h-3 w-3 rounded-full bg-red-500"></div>

              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>

              <div className="h-3 w-3 rounded-full bg-green-500"></div>

            </div>

            <div className="rounded-2xl bg-[#111827] p-5 text-gray-300">

              Создай образовательный квест
              по теме

              <span className="mt-3 block text-violet-400">

                «Дроби. 5 класс»

              </span>

            </div>

            <div className="mt-8 rounded-2xl bg-violet-600/20 p-6">

              <div className="font-bold text-violet-300">
                AI Questum
              </div>

              <p className="mt-5 leading-8 text-gray-300">

                ✔ 12 игровых заданий

                <br /><br />

                ✔ Сюжет квеста

                <br /><br />

                ✔ Командные испытания

                <br /><br />

                ✔ Финальная головоломка

                <br /><br />

                ✔ PDF для учителя

              </p>

            </div>

          </div>

        </div>

      </Container>

    </section>
  );
}