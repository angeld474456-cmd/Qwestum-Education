import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";

const subjects = [
  { icon: "🧮", title: "Алгебра", quests: 42, color: "from-violet-500 to-purple-600" },
  { icon: "📐", title: "Геометрия", quests: 28, color: "from-blue-500 to-cyan-500" },
  { icon: "⚛️", title: "Физика", quests: 35, color: "from-indigo-500 to-blue-500" },
  { icon: "🧪", title: "Химия", quests: 31, color: "from-pink-500 to-rose-500" },
  { icon: "🌍", title: "География", quests: 22, color: "from-green-500 to-emerald-500" },
  { icon: "🦴", title: "Биология", quests: 27, color: "from-lime-500 to-green-500" },
  { icon: "🏛️", title: "История", quests: 38, color: "from-amber-500 to-orange-500" },
  { icon: "💻", title: "Информатика", quests: 44, color: "from-sky-500 to-indigo-500" },
  { icon: "🇬🇧", title: "Английский", quests: 30, color: "from-red-500 to-pink-500" }
];

export default function Subjects() {
  return (
    <section className="py-32">
      <Container>

        <div className="text-center">

          <div className="font-semibold uppercase tracking-[0.3em] text-violet-400">
            Каталог
          </div>

          <h2 className="mt-6 text-5xl font-black">
            Выберите предмет
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-xl leading-9 text-gray-400">
            Более 300 готовых образовательных квестов,
            сгруппированных по школьным дисциплинам.
          </p>

        </div>

        <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

          {subjects.map((subject) => (

            <Card key={subject.title}>

              <div
                className={`flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${subject.color} text-5xl shadow-lg`}
              >
                {subject.icon}
              </div>

              <h3 className="mt-8 text-3xl font-bold">
                {subject.title}
              </h3>

              <p className="mt-3 text-gray-400">
                {subject.quests} готовых квестов
              </p>

              <button
                className="mt-8 w-full rounded-2xl border border-violet-500/30 bg-violet-500/10 py-4 font-semibold transition hover:bg-violet-600 hover:text-white"
              >
                Открыть предмет
              </button>

            </Card>

          ))}

        </div>

      </Container>
    </section>
  );
}