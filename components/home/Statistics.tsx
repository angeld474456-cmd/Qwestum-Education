import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";

const items = [
  {
    value: "321+",
    title: "Готовых квестов",
  },
  {
    value: "50+",
    title: "Предметов",
  },
  {
    value: "AI",
    title: "Создание уроков",
  },
  {
    value: "5–11",
    title: "Классы",
  },
];

export default function Statistics() {
  return (
    <section className="pb-32">

      <Container>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">

          {items.map((item) => (
            <Card key={item.title}>

              <div className="text-5xl font-black text-violet-400">
                {item.value}
              </div>

              <div className="mt-5 text-2xl font-semibold">
                {item.title}
              </div>

            </Card>
          ))}

        </div>

      </Container>

    </section>
  );
}