import Container from "@/components/ui/Container";
import QuestCard from "./QuestCard";
import { quests } from "./data";

export default function Catalog() {
  return (
    <section className="py-32">

      <Container>

        <div className="text-center">

          <div className="uppercase tracking-[0.3em] text-violet-400 font-semibold">
            Каталог
          </div>

          <h2 className="mt-6 text-5xl font-black">
            Популярные образовательные квесты
          </h2>

        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">

          {quests.map((quest) => (

            <QuestCard
              key={quest.id}
              {...quest}
            />

          ))}

        </div>

      </Container>

    </section>
  );
}